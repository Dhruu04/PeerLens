// src/components/PeerAdjustmentInspectorModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sliders, X, Copy, Check, ChevronLeft, ChevronRight, ChevronDown,
  Users, AlertTriangle, ShieldCheck,
  Calculator, FileText
} from 'lucide-react';
import type { ClassData, PeerAdjustmentConfig } from '../utils/math';
import { 
  calculateStudentPeerAdjustment, 
  PEER_ADJUSTMENT_METHODS_META, 
  getTeammates 
} from '../utils/math';

interface PeerAdjustmentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: ClassData;
  initialStudentId?: string | null;
  baseGroupGrade: number;
  config: PeerAdjustmentConfig;
  onConfigChange?: (newConfig: Partial<PeerAdjustmentConfig>) => void;
  onToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PeerAdjustmentInspectorModal: React.FC<PeerAdjustmentInspectorModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  initialStudentId,
  baseGroupGrade,
  config,
  onToast
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && activeClass.students.some(s => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return activeClass.students[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'calculation' | 'rubric'>('calculation');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync selectedStudentId when initialStudentId changes
  useEffect(() => {
    if (initialStudentId && activeClass.students.some(s => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId, activeClass.students]);

  const selectedStudent = useMemo(() => {
    return activeClass.students.find(s => s.id === selectedStudentId) || activeClass.students[0];
  }, [activeClass.students, selectedStudentId]);

  const studentIndex = useMemo(() => {
    return activeClass.students.findIndex(s => s.id === selectedStudentId);
  }, [activeClass.students, selectedStudentId]);

  const hasPrev = studentIndex > 0;
  const hasNext = studentIndex >= 0 && studentIndex < activeClass.students.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setSelectedStudentId(activeClass.students[studentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSelectedStudentId(activeClass.students[studentIndex + 1].id);
    }
  };

  // Group students by team for structured navigation
  const groupedStudents = useMemo(() => {
    const map: Record<string, typeof activeClass.students> = {};
    activeClass.students.forEach(s => {
      const team = s.groupName || 'Unassigned';
      if (!map[team]) map[team] = [];
      map[team].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [activeClass.students]);

  const adjustmentResult = useMemo(() => {
    if (!selectedStudent) return null;
    return calculateStudentPeerAdjustment(
      selectedStudent.id,
      selectedStudent.groupName,
      activeClass,
      baseGroupGrade,
      config
    );
  }, [selectedStudent, activeClass, baseGroupGrade, config]);

  const teammates = useMemo(() => {
    if (!selectedStudent) return [];
    return getTeammates(selectedStudent.id, selectedStudent.groupName, activeClass.students);
  }, [selectedStudent, activeClass.students]);

  const reviewsReceived = useMemo(() => {
    if (!selectedStudent) return [];
    return activeClass.reviews.filter(
      r => r.recipientId === selectedStudent.id && teammates.includes(r.reviewerId)
    );
  }, [selectedStudent, activeClass.reviews, teammates]);

  const methodMeta = PEER_ADJUSTMENT_METHODS_META[config.method] || PEER_ADJUSTMENT_METHODS_META.webpa;

  if (!isOpen || !selectedStudent || !adjustmentResult) return null;

  const pointDelta = Number((adjustmentResult.adjustedGrade - adjustmentResult.teamBaseGrade).toFixed(1));
  const isPositive = pointDelta > 0;
  const isNegative = pointDelta < 0;
  const completionPct = teammates.length > 0 ? Math.round((reviewsReceived.length / teammates.length) * 100) : 0;

  // Accurate, professional explanation note dynamically tailored to situation
  const explanationNote = useMemo(() => {
    if (!selectedStudent || !adjustmentResult) return '';
    const studentFirstName = selectedStudent.name.split(' ')[0];
    const teamName = selectedStudent.groupName;
    const baseMark = adjustmentResult.teamBaseGrade;
    const finalGrade = adjustmentResult.adjustedGrade;
    const delta = pointDelta;
    const deltaStr = delta > 0 ? `+${delta} pts` : delta < 0 ? `${delta} pts` : '0 pts';

    if (selectedStudent.isExcused) {
      return `Hi ${studentFirstName},\n\nYou have an approved exemption for ${activeClass.name} (${teamName}). A neutral 1.00× multiplier was applied without penalties. Your final grade is ${finalGrade} pts, matching the full team deliverable base mark.\n\nBest regards,\nCourse Instructor`;
    }

    if (adjustmentResult.penaltyApplied > 0) {
      return `Hi ${studentFirstName},\n\nHere is your grade breakdown for ${activeClass.name} (${teamName}):\n• Team Deliverable Base: ${baseMark} pts\n• Peer Review Baseline: ${adjustmentResult.rawRatio.toFixed(2)}×\n• Non-Submission Penalty: -${adjustmentResult.penaltyApplied}% (peer evaluations were not submitted by deadline)\n• Final Effective Multiplier: ${adjustmentResult.ratio.toFixed(2)}×\n• Final Individual Grade: ${finalGrade} pts (${deltaStr} vs base mark)\n\nAll peer evaluations are normalized to remove rater bias. Please reach out if you have any questions!\n\nBest regards,\nCourse Instructor`;
    }

    if (reviewsReceived.length === 0) {
      return `Hi ${studentFirstName},\n\nYour individual grade for ${activeClass.name} (${teamName}) is ${finalGrade} pts. Teammate evaluations are currently pending, so a neutral 1.00× multiplier was awarded, matching the team deliverable base of ${baseMark} pts.\n\nBest regards,\nCourse Instructor`;
    }

    return `Hi ${studentFirstName},\n\nHere is your individual grade summary for ${activeClass.name} (${teamName}):\n• Team Deliverable Base: ${baseMark} pts\n• Peer Contribution Multiplier: ${adjustmentResult.ratio.toFixed(2)}× (${reviewsReceived.length} of ${teammates.length} teammate reviews completed)\n• Final Individual Grade: ${finalGrade} pts (${deltaStr} vs base mark)\n\nReviewer evaluations are normalized to eliminate harsh/lenient rater bias. Great effort on the project!\n\nBest regards,\nCourse Instructor`;
  }, [selectedStudent, adjustmentResult, pointDelta, activeClass.name, reviewsReceived.length, teammates.length]);

  const handleCopyExplanation = () => {
    navigator.clipboard.writeText(explanationNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast('Copied explanation note to clipboard.', 'success');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.35rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Score Adjustment Inspector
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Method:
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 750,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary)'
                  }}
                >
                  {methodMeta.name}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ width: '30px', height: '30px', padding: 0, color: 'var(--text-muted)', borderRadius: '8px' }}
            title="Close Inspector"
          >
            <X size={17} />
          </button>
        </div>

        {/* Student Switcher Bar (Fix: Explicit heights & padding so text is never cut off) */}
        <div
          style={{
            padding: '0.65rem 1.35rem',
            backgroundColor: 'var(--bg-app)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrev}
            disabled={!hasPrev}
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
            title="Previous student"
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 2.2rem 0 0.85rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                lineHeight: '36px',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              {groupedStudents.map(([teamName, studentsInTeam]) => (
                <optgroup key={teamName} label={`Team: ${teamName}`}>
                  {studentsInTeam.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isExcused ? '• [Excused]' : !s.submitted ? '• [Missing Review]' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ChevronDown size={15} />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleNext}
            disabled={!hasNext}
            style={{
              width: '36px',
              height: '36px',
              padding: 0,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px'
            }}
            title="Next student"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '1.15rem 1.35rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border-color) transparent'
          }}
        >
          
          {/* Hero Formula Outcome Card */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}
          >
            {/* Team Base Mark */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Team Base
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 850, color: 'var(--text-primary)', display: 'block', marginTop: '0.1rem' }}>
                {adjustmentResult.teamBaseGrade}
              </span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                deliverable mark
              </span>
            </div>

            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>×</span>

            {/* Peer Multiplier */}
            <div style={{ textAlign: 'center', flex: 1 }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Multiplier
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 850, color: 'var(--primary)', display: 'block', marginTop: '0.1rem' }}>
                {adjustmentResult.ratio.toFixed(2)}×
              </span>
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: adjustmentResult.penaltyApplied > 0 ? 700 : 500,
                  color: adjustmentResult.penaltyApplied > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)'
                }}
              >
                {adjustmentResult.penaltyApplied > 0 ? `-${adjustmentResult.penaltyApplied}% penalty` : `${Math.round(config.fudgeWeight * 100)}% sensitivity`}
              </span>
            </div>

            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)' }}>=</span>

            {/* Final Adjusted Grade */}
            <div style={{ textAlign: 'center', flex: 1.2 }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Final Grade
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: isPositive ? 'var(--accent-teal)' : isNegative ? 'var(--accent-rose)' : 'var(--text-primary)'
                  }}
                >
                  {adjustmentResult.adjustedGrade}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.12)' : isNegative ? 'rgba(239, 68, 68, 0.12)' : 'rgba(156, 163, 175, 0.12)',
                    color: isPositive ? 'var(--accent-teal)' : isNegative ? 'var(--accent-rose)' : 'var(--text-muted)'
                  }}
                >
                  {pointDelta >= 0 ? `+${pointDelta}` : pointDelta} pts
                </span>
              </div>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                individual grade
              </span>
            </div>
          </div>

          {/* Contextual Status Alerts */}
          {selectedStudent.isExcused && (
            <div
              style={{
                padding: '0.55rem 0.8rem',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 650
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Approved Exemption:</strong> Excused from peer review. Multiplier locked to neutral 1.00× without penalties.
              </span>
            </div>
          )}

          {!selectedStudent.submitted && !selectedStudent.isExcused && config.penalizeNonSubmitters && (
            <div
              style={{
                padding: '0.55rem 0.8rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 650
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Review Not Submitted:</strong> Did not submit evaluations. Multiplier penalized by -{config.nonSubmitterPenalty}% ({pointDelta} pts).
              </span>
            </div>
          )}

          {/* Clean Segmented Tab Navigation Controls */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid var(--border-color)',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('calculation')}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'calculation' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'calculation' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'calculation' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                fontWeight: activeTab === 'calculation' ? 750 : 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Calculator size={14} /> Calculation Breakdown
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rubric')}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'rubric' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'rubric' ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'rubric' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                fontWeight: activeTab === 'rubric' ? 750 : 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={14} /> Teammate Ratings ({reviewsReceived.length}/{teammates.length})
            </button>
          </div>

          {/* Tab 1: Calculation Breakdown */}
          {activeTab === 'calculation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* 4 Essential Calculation Factors */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.65rem'
                }}
              >
                {/* Factor 1: Peer Consensus */}
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Peer Consensus
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {adjustmentResult.rawRatio.toFixed(2)}×
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      raw WebPA
                    </span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {reviewsReceived.length === 0 ? 'No peer evaluations yet' : `${adjustmentResult.breakdown.rawPeerPercentage}% vs ${adjustmentResult.breakdown.teamAveragePeerPercentage}% team avg`}
                  </span>
                </div>

                {/* Factor 2: Sensitivity Weight */}
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Sensitivity Weight
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {Math.round(config.fudgeWeight * 100)}%
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      peer impact
                    </span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {100 - Math.round(config.fudgeWeight * 100)}% fixed to base mark
                  </span>
                </div>

                {/* Factor 3: Reviews Received */}
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Teammate Reviews
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {reviewsReceived.length} of {teammates.length}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: completionPct === 100 ? 'var(--accent-teal)' : 'var(--text-secondary)' }}>
                      ({completionPct}%)
                    </span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    Leniency &amp; harshness normalized
                  </span>
                </div>

                {/* Factor 4: Submission & Penalties */}
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Submission &amp; Cap
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        color: selectedStudent.isExcused
                          ? '#4f46e5'
                          : selectedStudent.submitted
                            ? 'var(--accent-teal)'
                            : 'var(--accent-rose)'
                      }}
                    >
                      {selectedStudent.isExcused ? 'Excused' : selectedStudent.submitted ? 'Submitted' : 'Missing Reviews'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    {adjustmentResult.penaltyApplied > 0 ? `Penalty applied: -${adjustmentResult.penaltyApplied}%` : `Max Grade Cap: ${config.capAtMaxGrade ? '100' : 'Off'}`}
                  </span>
                </div>
              </div>

              {/* Ready-to-Copy Student Feedback Note */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={14} className="text-teal" /> Explanation Note (for Student or LMS):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyExplanation}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.68rem', height: '24px', padding: '0 0.55rem', gap: '0.3rem', fontWeight: 700 }}
                  >
                    {copied ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy Note'}</span>
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                  {selectedStudent.isExcused ? (
                    <>
                      <strong>{selectedStudent.name.split(' ')[0]}</strong> has an approved exemption. Multiplier is locked to neutral <strong>1.00×</strong>, awarding the full <strong>{adjustmentResult.teamBaseGrade} pt</strong> team base grade.
                    </>
                  ) : adjustmentResult.penaltyApplied > 0 ? (
                    <>
                      <strong>{selectedStudent.name.split(' ')[0]}</strong> had a neutral <strong>{adjustmentResult.rawRatio.toFixed(2)}×</strong> peer baseline, but received a <strong>-{adjustmentResult.penaltyApplied}% deduction</strong> for unsubmitted evaluations. Final score is <strong>{adjustmentResult.adjustedGrade} pts</strong> ({pointDelta >= 0 ? `+${pointDelta}` : pointDelta} pts).
                    </>
                  ) : reviewsReceived.length === 0 ? (
                    <>
                      Teammate evaluations are pending. <strong>{selectedStudent.name.split(' ')[0]}</strong> is awarded a neutral <strong>1.00×</strong> multiplier, matching the <strong>{adjustmentResult.teamBaseGrade} pt</strong> team base mark.
                    </>
                  ) : (
                    <>
                      <strong>{selectedStudent.name.split(' ')[0]}</strong> earned a contribution multiplier of <strong>{adjustmentResult.ratio.toFixed(2)}×</strong> from {reviewsReceived.length} teammate evaluations. Applied to the <strong>{adjustmentResult.teamBaseGrade} pt</strong> deliverable, the final score is <strong>{adjustmentResult.adjustedGrade} pts</strong> ({pointDelta >= 0 ? `+${pointDelta}` : pointDelta} pts).
                    </>
                  )}
                </p>
              </div>

            </div>
          )}

          {/* Tab 2: Teammate Rubric Ratings */}
          {activeTab === 'rubric' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 750, color: 'var(--text-secondary)' }}>
                  Evaluations by Teammates ({reviewsReceived.length} of {teammates.length} completed)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Normalized out of criteria max
                </span>
              </div>

              {reviewsReceived.length === 0 ? (
                <div
                  style={{
                    padding: '1.75rem 1.25rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    lineHeight: 1.5
                  }}
                >
                  <Users size={24} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                  <div>No teammate reviews submitted yet for this student.</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                    Multiplier defaults to neutral 1.00× until reviews are completed.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeClass.fields.map(f => {
                    const scores = reviewsReceived
                      .map(r => r.scores[f.id])
                      .filter((s): s is number => typeof s === 'number');
                    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                    const pct = f.max > 0 ? Math.min(100, Math.round((avg / f.max) * 100)) : 0;

                    return (
                      <div
                        key={f.id}
                        style={{
                          padding: '0.65rem 0.85rem',
                          backgroundColor: 'var(--bg-app)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {avg.toFixed(1)} <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {f.max} ({pct}%)</span>
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: '5px',
                            backgroundColor: 'var(--border-color)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: pct >= 80 ? 'var(--accent-teal)' : pct >= 60 ? 'var(--primary)' : 'var(--accent-rose)',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                All reviewer scores are automatically normalized to remove lenient and harsh rater biases.
              </span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.35rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Student {studentIndex + 1} of {activeClass.students.length} • {selectedStudent.groupName}
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ fontWeight: 750, fontSize: '0.78rem', minWidth: '75px' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default PeerAdjustmentInspectorModal;
