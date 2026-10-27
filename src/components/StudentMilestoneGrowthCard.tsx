// src/components/StudentMilestoneGrowthCard.tsx
// Comprehensive student-facing milestone history and growth/fall trajectory dashboard
// Displays dynamic red flags, recovery turnarounds, cumulative scores, and round-by-round peer feedback

import React, { useState, useMemo } from 'react';
import type { ClassData, Student } from '../utils/math';
import { getEvaluationControls } from '../utils/math';
import { 
  calculateSubPeerReviewMetrics, 
  type SubPeerReviewRound,
  type StudentSubReviewTrajectory,
  type StudentRoundEvaluation
} from '../utils/subPeerReview';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle,
  CheckCircle2,
  Sparkles, 
  Award, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ShieldAlert,
  ThumbsUp,
  Target,
  Lock,
  Eye
} from 'lucide-react';

interface StudentMilestoneGrowthCardProps {
  activeClass: ClassData;
  student: Student;
  onOpenSubReviewModal: (round: SubPeerReviewRound) => void;
  onToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const StudentMilestoneGrowthCard: React.FC<StudentMilestoneGrowthCardProps> = ({
  activeClass,
  student,
  onOpenSubReviewModal,
  onToast: _onToast
}) => {
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const evalControls = getEvaluationControls(activeClass);

  // Compute all longitudinal sub peer review metrics
  const metrics = useMemo(() => {
    return calculateSubPeerReviewMetrics(activeClass);
  }, [activeClass]);

  const rounds = activeClass.subPeerReviewRounds || [];

  // Find the student's personal trajectory
  const studentTrajectory: StudentSubReviewTrajectory | undefined = useMemo(() => {
    return metrics.allStudentTrajectories.find(t => t.studentId === student.id);
  }, [metrics.allStudentTrajectories, student.id]);

  // Find currently active checkpoint if any
  const activeRound = useMemo(() => {
    return rounds.find(r => r.status === 'active') || null;
  }, [rounds]);

  // Check if current student has submitted for active round
  const hasSubmittedActiveRound = useMemo(() => {
    if (!activeRound) return false;
    return (activeRound.reviews || []).some(r => r.reviewerId === student.id);
  }, [activeRound, student.id]);

  // If professor has not configured any sub-peer review rounds, keep it completely hidden (optional)
  if (rounds.length === 0) {
    return null;
  }

  const isAtRisk = studentTrajectory?.currentFlagStatus === 'at_risk';
  const isRecovered = studentTrajectory?.currentFlagStatus === 'recovered';
  const isThriving = studentTrajectory?.currentFlagStatus === 'thriving';

  const completedRoundsCount = studentTrajectory?.roundsCount || 0;
  const cumulativePct = studentTrajectory?.cumulativeScorePct ?? 0;

  // Compute overall growth delta from round 1 to latest round
  const evals = studentTrajectory?.roundEvaluations || [];
  const firstEval = evals[0];
  const lastEval = evals[evals.length - 1];
  const overallDelta = (evals.length >= 2 && firstEval?.scorePct != null && lastEval?.scorePct != null)
    ? (lastEval.scorePct - firstEval.scorePct)
    : 0;

  const teamDelta = studentTrajectory?.cumulativeDeltaPct ?? 0;

  return (
    <div 
      className="card"
      style={{ 
        padding: 'clamp(0.9rem, 2.5vw, 1.35rem)', 
        borderRadius: '16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        border: isAtRisk 
          ? '1.5px solid rgba(239, 68, 68, 0.4)' 
          : isRecovered 
            ? '1.5px solid rgba(16, 185, 129, 0.4)' 
            : '1px solid var(--border-color)', 
        backgroundColor: 'var(--bg-surface)', 
        boxShadow: isAtRisk 
          ? '0 4px 20px rgba(239, 68, 68, 0.08)' 
          : isRecovered 
            ? '0 4px 20px rgba(16, 185, 129, 0.08)' 
            : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Active Round Callout Banner if an interim round is open */}
      {activeRound && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            background: hasSubmittedActiveRound
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(20, 184, 166, 0.12) 100%)',
            border: hasSubmittedActiveRound
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1.5px solid rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: hasSubmittedActiveRound ? '#10b981' : 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {hasSubmittedActiveRound ? <CheckCircle size={20} /> : <Target size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span 
                  className={`badge ${hasSubmittedActiveRound ? 'badge-teal' : 'badge-indigo'}`} 
                  style={{ fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {hasSubmittedActiveRound ? (
                    <>
                      <CheckCircle2 size={12} /> Checkpoint Completed
                    </>
                  ) : (
                    <>
                      <Target size={12} /> Checkpoint Open
                    </>
                  )}
                </span>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeRound.title}
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {hasSubmittedActiveRound
                  ? 'Your interim evaluation has been submitted. You may update your feedback while this milestone is open.'
                  : 'Your professor opened this interim check-in. Evaluate your teammates to share constructive formative feedback.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`${hasSubmittedActiveRound ? 'btn btn-secondary' : 'btn btn-primary'} subpeer-active-banner-btn`}
            onClick={() => onOpenSubReviewModal(activeRound)}
            style={{
              fontWeight: 800,
              fontSize: '0.84rem',
              height: '38px',
              padding: '0 1.1rem',
              borderRadius: '8px',
              gap: '0.4rem',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            {hasSubmittedActiveRound ? 'Edit Milestone Review' : 'Complete Milestone Review'}
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Main Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.9rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={17} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Milestone Sub-Peer Reviews &amp; Growth Trajectory
            </h3>

            {/* Dynamic Status Badges */}
            {isRecovered && (
              <span 
                className="badge badge-teal" 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  gap: '0.3rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Sparkles size={12} /> Recovered Turnaround <TrendingUp size={11} />
              </span>
            )}

            {isAtRisk && (
              <span 
                className="badge badge-danger" 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  gap: '0.3rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <ShieldAlert size={12} /> Below Team Average
              </span>
            )}

            {isThriving && (
              <span 
                className="badge badge-indigo" 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  gap: '0.3rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Award size={12} /> Top Contributor
              </span>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Formative checkpoints conducted across your project duration. Tracks growth over time and clears red flags as performance improves.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-secondary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
            {completedRoundsCount} of {rounds.length} Rounds Evaluated
          </span>
        </div>
      </div>

      {/* Dynamic Feedback Callout Notice */}
      {isRecovered && (
        <div 
          style={{ 
            padding: '0.85rem 1rem', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <Sparkles size={18} className="text-teal" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <strong>Great Turnaround!</strong> You bounced back from earlier struggles. Your teammates have noticed your increased commitment and contributions, successfully clearing your red flag into positive recovery standing!
          </div>
        </div>
      )}

      {isAtRisk && completedRoundsCount > 0 && (
        <div 
          style={{ 
            padding: '0.85rem 1rem', 
            borderRadius: '10px', 
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <ShieldAlert size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <strong>Improvement Opportunity:</strong> Your current round score is lagging your team average by {Math.abs(teamDelta).toFixed(1)}%. Review constructive suggestions from your teammates below to turn your performance around in the next milestone!
          </div>
        </div>
      )}

      {/* KPI Stats Cards - Mobile Friendly Grid */}
      <div className="kpi-stats-grid">
        
        {/* Cumulative Score */}
        <div className="kpi-tile">
          <span className="kpi-label">
            Cumulative Score
          </span>
          <div 
            className={`kpi-number ${completedRoundsCount === 0 ? 'kpi-text-value' : ''}`}
            style={{ 
              color: completedRoundsCount === 0 
                ? 'var(--text-muted)' 
                : isAtRisk 
                  ? '#ef4444' 
                  : isRecovered 
                    ? '#10b981' 
                    : 'var(--text-primary)', 
              marginTop: '0.2rem' 
            }}
          >
            {completedRoundsCount > 0 ? `${cumulativePct.toFixed(1)}%` : 'Pending'}
          </div>
          <span className="kpi-subtext" title={completedRoundsCount === 0 ? 'Awaiting checkpoint closure' : `Weighted across ${completedRoundsCount} checkpoint${completedRoundsCount > 1 ? 's' : ''}`}>
            {completedRoundsCount === 0 
              ? 'Awaiting checkpoint' 
              : `Weighted across ${completedRoundsCount} checkpoint${completedRoundsCount > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Growth Trajectory Delta */}
        <div className="kpi-tile">
          <span className="kpi-label">
            Growth Delta
          </span>
          <div 
            className={`kpi-number ${completedRoundsCount < 2 ? 'kpi-text-value' : ''}`}
            style={{ 
              color: completedRoundsCount < 2 
                ? 'var(--text-muted)' 
                : overallDelta > 0 
                  ? '#10b981' 
                  : overallDelta < 0 
                    ? '#ef4444' 
                    : 'var(--text-secondary)', 
              marginTop: '0.2rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.2rem' 
            }}
          >
            {completedRoundsCount === 0 ? (
              <span>—</span>
            ) : completedRoundsCount === 1 ? (
              <span>Baseline</span>
            ) : (
              <>
                {overallDelta > 0 ? <TrendingUp size={16} /> : overallDelta < 0 ? <TrendingDown size={16} /> : <Minus size={14} />}
                {overallDelta > 0 ? `+${overallDelta.toFixed(1)}%` : `${overallDelta.toFixed(1)}%`}
              </>
            )}
          </div>
          <span className="kpi-subtext" title={completedRoundsCount === 0 ? 'Requires 2+ rounds' : completedRoundsCount === 1 ? 'Round 1 established' : `From R1 to R${completedRoundsCount}`}>
            {completedRoundsCount === 0 
              ? 'Requires 2+ rounds' 
              : completedRoundsCount === 1 
                ? 'Round 1 established' 
                : `From R1 to R${completedRoundsCount}`}
          </span>
        </div>

        {/* Team Benchmark Comparison */}
        <div className="kpi-tile">
          <span className="kpi-label">
            Team Benchmark
          </span>
          <div 
            className={`kpi-number ${completedRoundsCount === 0 ? 'kpi-text-value' : ''}`}
            style={{ 
              color: completedRoundsCount === 0 
                ? 'var(--text-muted)' 
                : teamDelta > 0 
                  ? '#10b981' 
                  : teamDelta < 0 
                    ? '#ef4444' 
                    : 'var(--text-secondary)', 
              marginTop: '0.2rem' 
            }}
          >
            {completedRoundsCount === 0 ? (
              <span>—</span>
            ) : teamDelta === 0 ? (
              '0.0%'
            ) : teamDelta > 0 ? (
              `+${teamDelta.toFixed(1)}%`
            ) : (
              `${teamDelta.toFixed(1)}%`
            )}
          </div>
          <span className="kpi-subtext" title={completedRoundsCount === 0 ? 'Available after round close' : `vs ${student.groupName || 'team'} average`}>
            {completedRoundsCount === 0 
              ? 'Pending round close' 
              : `vs ${student.groupName || 'team'} avg`}
          </span>
        </div>

      </div>

      {/* Round-by-Round Timeline & Specific Feedback */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Round-by-Round Milestone History ({studentTrajectory?.roundEvaluations.length || 0})
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Click any round to view anonymized peer feedback
          </span>
        </div>

        {(!studentTrajectory || studentTrajectory.roundEvaluations.length === 0) ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
            <Clock size={24} style={{ margin: '0 auto 0.4rem', opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              No completed milestone evaluations for your profile yet. Once peer evaluations are recorded, your milestone history will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {studentTrajectory.roundEvaluations.map((rEval: StudentRoundEvaluation, idx: number) => {
              const isExpanded = expandedRoundId === rEval.roundId;
              const delta = rEval.deltaPct ?? 0;
              const isBelowAvg = delta < -3.5;
              const isExceeding = delta > 3.5;
              const roundObj = rounds.find(r => r.id === rEval.roundId);
              const roundWeight = roundObj?.weight ?? 1;

              return (
                <div
                  key={rEval.roundId}
                  style={{
                    borderRadius: '10px',
                    border: `1px solid ${isBelowAvg ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
                    backgroundColor: isBelowAvg ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-app)',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Round Header Bar */}
                  <div
                    onClick={() => setExpandedRoundId(isExpanded ? null : rEval.roundId)}
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: isBelowAvg ? '#ef4444' : isExceeding ? '#10b981' : 'var(--primary)',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {rEval.roundTitle}
                          </span>
                          {roundObj?.status === 'active' ? (
                            <span className="badge badge-teal" style={{ fontSize: '0.62rem', padding: '1px 5px', fontWeight: 700 }}>
                              ● Active
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              Closed
                            </span>
                          )}
                          {isBelowAvg ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '1px 5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <ShieldAlert size={10} /> Below Team Avg
                            </span>
                          ) : isExceeding ? (
                            <span className="badge badge-teal" style={{ fontSize: '0.65rem', padding: '1px 5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Award size={10} /> Exceeding
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                              On Track
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Weight: {roundWeight}x &bull; {rEval.reviewsCount} peer evaluations received
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.94rem', fontWeight: 900, color: isBelowAvg ? '#ef4444' : 'var(--text-primary)' }}>
                          {(rEval.scorePct ?? 0).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: delta >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                          {delta >= 0 ? `+${delta.toFixed(1)}% vs team` : `${delta.toFixed(1)}% vs team`}
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Specific Peer Feedback */}
                  {isExpanded && (
                    <div 
                      style={{ 
                        padding: '1rem', 
                        borderTop: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      {/* Criteria Breakdown */}
                      {Object.keys(rEval.criterionScores).length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Criterion Performance Breakdown
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.35rem' }}>
                            {Object.entries(rEval.criterionScores).map(([critId, score]: [string, number]) => (
                              <div 
                                key={critId}
                                style={{ 
                                  padding: '0.5rem 0.75rem', 
                                  borderRadius: '6px', 
                                  backgroundColor: 'var(--bg-app)', 
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                  {critId.replace(/_/g, ' ')}
                                </span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                                  {score.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Praise Tags */}
                      {evalControls.showPraiseTags && rEval.praiseTags.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Peer Commendations Received
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                            {rEval.praiseTags.map((tag: string, tIdx: number) => (
                              <span 
                                key={tIdx}
                                className="badge badge-indigo"
                                style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '12px' }}
                              >
                                <ThumbsUp size={10} style={{ marginRight: '3px' }} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths Comments */}
                      {evalControls.showStrengthsFeedback && rEval.strengths.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Teammate Strengths Recognized
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                            {rEval.strengths.map((text: string, sIdx: number) => (
                              <div
                                key={sIdx}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                &ldquo;{text}&rdquo;
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Constructive Growth Feedback */}
                      {evalControls.showGrowthSuggestions && rEval.growthSuggestions.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Constructive Growth Suggestions
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                            {rEval.growthSuggestions.map((text: string, gIdx: number) => (
                              <div
                                key={gIdx}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(245, 158, 11, 0.06)',
                                  border: '1px solid rgba(245, 158, 11, 0.2)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                &ldquo;{text}&rdquo;
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inspect Submitted Review for this Round */}
                      {roundObj && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.45rem', borderTop: '1px solid var(--border-color)', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSubReviewModal(roundObj);
                            }}
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              height: '30px',
                              padding: '0 0.85rem',
                              borderRadius: '6px',
                              gap: '0.35rem',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            {roundObj.status === 'closed' ? (
                              <>
                                <Lock size={12} className="text-muted" /> View My Given Feedback (Locked)
                              </>
                            ) : (
                              <>
                                <Eye size={12} className="text-teal" /> View / Edit My Given Feedback
                              </>
                            )}
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
export default StudentMilestoneGrowthCard;
