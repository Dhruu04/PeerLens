// src/components/SubPeerReviewStudio.tsx
// Formative Sub Peer Review & Longitudinal Milestone Studio
// Clean, minimal, and high-quality UI matching the core app theme.

import React, { useState, useMemo, useEffect } from 'react';
import type { ClassData, Review, GradingScaleField } from '../utils/math';
import { 
  calculateSubPeerReviewMetrics, 
  type SubPeerReviewRound, 
  type StudentSubReviewTrajectory, 
  type StudentSubReviewFlagStatus,
  DEFAULT_SUB_PEER_REVIEW_CONFIG
} from '../utils/subPeerReview';
import { useClass } from '../context/ClassContext';
import Modal from './Modal';
import { 
  Plus, 
  Eye, 
  Download, 
  Sparkles, 
  Calendar, 
  Award, 
  Target, 
  Trash2, 
  Search, 
  ShieldAlert, 
  Send, 
  Sliders, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  TrendingUp,
  TrendingDown,
  UserCheck
} from 'lucide-react';

interface SubPeerReviewStudioProps {
  activeClass: ClassData;
  onToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

type StudioTab = 'matrix' | 'milestones' | 'watchlist' | 'settings';
type TrajectoryViewMode = 'teams' | 'flat';

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Inline SVG Trajectory Sparkline
   ═══════════════════════════════════════════════════════════════════════════ */
interface TrajectorySparklineProps {
  points: Array<{ roundTitle: string; scorePct: number; deltaPct: number }>;
  teamAvgPct?: number | null;
  width?: number;
  height?: number;
}

const TrajectorySparkline: React.FC<TrajectorySparklineProps> = ({
  points,
  teamAvgPct,
  width = 84,
  height = 24
}) => {
  if (!points || points.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>—</span>;
  }

  const padX = 5;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  if (points.length === 1) {
    const pt = points[0];
    const isLagging = pt.deltaPct < -10;
    const isAhead = pt.deltaPct >= 5;
    const color = isLagging ? '#ef4444' : isAhead ? '#10b981' : '#6366f1';

    return (
      <div 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        title={`${pt.roundTitle}: ${pt.scorePct}% (${pt.deltaPct > 0 ? '+' : ''}${pt.deltaPct}% vs team)`}
      >
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
          <line
            x1={padX}
            y1={height / 2}
            x2={width - padX}
            y2={height / 2}
            stroke="var(--border-color)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <circle
            cx={width / 2}
            cy={height / 2}
            r="4"
            fill={color}
            stroke="var(--bg-surface)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  const minScore = Math.min(...points.map(p => p.scorePct), teamAvgPct ?? 70, 50);
  const maxScore = Math.max(...points.map(p => p.scorePct), teamAvgPct ?? 90, 100);
  const scoreRange = Math.max(15, maxScore - minScore);

  const coords = points.map((p, idx) => {
    const x = padX + (idx / (points.length - 1)) * innerW;
    const normalizedY = (p.scorePct - minScore) / scoreRange;
    const y = padY + innerH - normalizedY * innerH;
    return { x, y, ...p };
  });

  const lastPoint = coords[coords.length - 1];
  const firstPoint = coords[0];
  const isUpward = lastPoint.scorePct >= firstPoint.scorePct;
  const isLastLagging = lastPoint.deltaPct < -10;
  const strokeColor = isLastLagging ? '#ef4444' : isUpward ? '#10b981' : '#f59e0b';

  const polylineStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  let teamAvgY: number | null = null;
  if (teamAvgPct !== null && teamAvgPct !== undefined) {
    const normalizedAvg = (teamAvgPct - minScore) / scoreRange;
    teamAvgY = padY + innerH - Math.max(0, Math.min(1, normalizedAvg)) * innerH;
  }

  return (
    <div 
      style={{ display: 'inline-flex', alignItems: 'center' }}
      title={coords.map(c => `${c.roundTitle}: ${c.scorePct}%`).join(' → ')}
    >
      <svg 
        width={width} 
        height={height} 
        style={{ overflow: 'visible', verticalAlign: 'middle' }}
      >
        {teamAvgY !== null && (
          <line
            x1={padX}
            y1={teamAvgY}
            x2={width - padX}
            y2={teamAvgY}
            stroke="var(--chart-axis, #94a3b8)"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity={0.4}
          />
        )}

        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />

        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 3 : 2}
            fill={strokeColor}
            stroke="var(--bg-surface)"
            strokeWidth={1}
          />
        ))}
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Full-Width Trajectory Line Chart (Inspector Modal)
   ═══════════════════════════════════════════════════════════════════════════ */
interface FullTrajectoryChartProps {
  trajectory: StudentSubReviewTrajectory;
  rounds: SubPeerReviewRound[];
}

const FullTrajectoryChart: React.FC<FullTrajectoryChartProps> = ({ trajectory, rounds }) => {
  const chartW = 500;
  const chartH = 130;
  const padX = 40;
  const padY = 20;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  const validEvals = rounds.map((r, idx) => {
    const ev = trajectory.roundEvaluations.find(e => e.roundId === r.id);
    return {
      roundIdx: idx + 1,
      roundTitle: r.title,
      scorePct: ev?.scorePct ?? null,
      teamAvgPct: ev?.teamAvgPct ?? null,
      deltaPct: ev?.deltaPct ?? null
    };
  });

  const validScores = validEvals.filter(v => v.scorePct !== null).map(v => v.scorePct as number);
  const validAvgs = validEvals.filter(v => v.teamAvgPct !== null).map(v => v.teamAvgPct as number);

  if (validScores.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        No milestone records evaluated for this student yet
      </div>
    );
  }

  const minVal = Math.max(0, Math.min(...validScores, ...validAvgs, 50) - 10);
  const maxVal = Math.min(100, Math.max(...validScores, ...validAvgs, 95) + 5);
  const range = Math.max(20, maxVal - minVal);

  const getX = (idx: number) => padX + (idx / Math.max(1, rounds.length - 1)) * innerW;
  const getY = (val: number) => padY + innerH - ((val - minVal) / range) * innerH;

  const studentPoints = validEvals
    .map((v, i) => v.scorePct !== null ? { x: getX(i), y: getY(v.scorePct), val: v.scorePct } : null)
    .filter(Boolean) as Array<{ x: number; y: number; val: number }>;

  const teamPoints = validEvals
    .map((v, i) => v.teamAvgPct !== null ? { x: getX(i), y: getY(v.teamAvgPct), val: v.teamAvgPct } : null)
    .filter(Boolean) as Array<{ x: number; y: number; val: number }>;

  const isTrailing = (trajectory.cumulativeDeltaPct ?? 0) < -10;
  const strokeColor = isTrailing ? '#ef4444' : (trajectory.cumulativeDeltaPct ?? 0) >= 4 ? '#10b981' : 'var(--primary)';

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0.85rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.74rem' }}>
        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Performance Trajectory</span>
        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: strokeColor }}>
            <span style={{ width: '10px', height: '2px', backgroundColor: strokeColor }} /> Student
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '10px', height: '1px', borderTop: '1px dashed #94a3b8' }} /> Team Avg
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {[0, 0.5, 1].map((pct, idx) => {
          const val = Math.round(minVal + pct * range);
          const y = padY + innerH - pct * innerH;
          return (
            <g key={idx}>
              <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{val}%</text>
            </g>
          );
        })}

        {teamPoints.length > 1 && (
          <polyline fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" points={teamPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
        )}

        {studentPoints.length > 1 && (
          <polyline fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={studentPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} />
        )}

        {studentPoints.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill={strokeColor} stroke="var(--bg-surface)" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--text-primary)">{p.val}%</text>
          </g>
        ))}

        {rounds.map((r, idx) => (
          <text key={r.id} x={getX(idx)} y={chartH - 2} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text-secondary)">
            S{idx + 1}
          </text>
        ))}
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: SubPeerReviewStudio
   ═══════════════════════════════════════════════════════════════════════════ */
export const SubPeerReviewStudio: React.FC<SubPeerReviewStudioProps> = ({
  activeClass,
  onToast
}) => {
  const { 
    createSubPeerReviewRound, 
    updateSubPeerReviewRound, 
    deleteSubPeerReviewRound, 
    seedSampleSubPeerReviews,
    deleteSubPeerReviewEvaluation,
    updateSubPeerReviewEvaluation,
    updateSubPeerReviewManualOverride,
    updateSubPeerReviewConfig,
    clearAllSubPeerReviews
  } = useClass();

  // Active Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('matrix');
  const [viewMode, setViewMode] = useState<TrajectoryViewMode>('teams');

  // Modals & Inspection State
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isEditRoundModalOpen, setIsEditRoundModalOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<SubPeerReviewRound | null>(null);
  
  // Track inspecting student by ID
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);

  // Review Editing Modal State
  const [editingReviewModal, setEditingReviewModal] = useState<{
    roundId: string;
    roundTitle: string;
    studentId: string;
    studentName: string;
    review: Review;
  } | null>(null);
  const [editReviewScores, setEditReviewScores] = useState<Record<string, number>>({});
  const [editReviewStrengths, setEditReviewStrengths] = useState('');
  const [editReviewGrowth, setEditReviewGrowth] = useState('');

  // Confirmation for Reset / Clear All
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');

  // New Round Form State (No presets, clean form)
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newWeight, setNewWeight] = useState(1);
  const [newNote, setNewNote] = useState('');

  // Edit Round Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editWeight, setEditWeight] = useState(1);
  const [editStatus, setEditStatus] = useState<'active' | 'closed'>('active');
  const [editNote, setEditNote] = useState('');

  // Thresholds Config Form State
  const classConfig = activeClass.subPeerReviewConfig || DEFAULT_SUB_PEER_REVIEW_CONFIG;
  const [configAtRiskDelta, setConfigAtRiskDelta] = useState<number>(classConfig.atRiskDeltaThreshold ?? -10);
  const [configAtRiskScore, setConfigAtRiskScore] = useState<number>(classConfig.atRiskScoreCutoff ?? 60);
  const [configWatchDelta, setConfigWatchDelta] = useState<number>(classConfig.watchDeltaThreshold ?? -3.5);
  const [configThrivingDelta, setConfigThrivingDelta] = useState<number>(classConfig.thrivingDeltaThreshold ?? 6);
  const [configGrowthDelta, setConfigGrowthDelta] = useState<number>(classConfig.growthMinDelta ?? 4);

  useEffect(() => {
    const cfg = activeClass.subPeerReviewConfig || DEFAULT_SUB_PEER_REVIEW_CONFIG;
    setConfigAtRiskDelta(cfg.atRiskDeltaThreshold ?? -10);
    setConfigAtRiskScore(cfg.atRiskScoreCutoff ?? 60);
    setConfigWatchDelta(cfg.watchDeltaThreshold ?? -3.5);
    setConfigThrivingDelta(cfg.thrivingDeltaThreshold ?? 6);
    setConfigGrowthDelta(cfg.growthMinDelta ?? 4);
  }, [activeClass.subPeerReviewConfig]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'at_risk' | 'recovered' | 'thriving' | 'on_track' | 'overridden'>('all');

  // Accordion state inside inspector modal
  const [expandedRoundReviews, setExpandedRoundReviews] = useState<Record<string, boolean>>({});

  // Compute metrics
  const metrics = useMemo(() => {
    return calculateSubPeerReviewMetrics(activeClass);
  }, [activeClass]);

  const {
    rounds,
    activeRound,
    totalRounds,
    classCumulativeScorePct,
    flaggedAtRiskCount,
    recoveredCount,
    thrivingCount,
    teamSummaries,
    allStudentTrajectories
  } = metrics;

  const activeInspectingStudent = useMemo(() => {
    if (!inspectingStudentId) return null;
    return allStudentTrajectories.find(s => s.studentId === inspectingStudentId) || null;
  }, [allStudentTrajectories, inspectingStudentId]);

  // Filtered teams & students
  const filteredTeamSummaries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return teamSummaries
      .map(team => {
        if (filterTeam !== 'all' && team.groupName !== filterTeam) return null;

        const filteredStudents = team.students.filter(student => {
          if (filterStatus === 'overridden') {
            if (!student.isManuallyOverridden) return false;
          } else if (filterStatus !== 'all' && student.currentFlagStatus !== filterStatus) {
            return false;
          }

          if (query) {
            const matchName = student.studentName.toLowerCase().includes(query);
            const matchEmail = (student.studentEmail || '').toLowerCase().includes(query);
            const matchTeam = student.groupName.toLowerCase().includes(query);
            return matchName || matchEmail || matchTeam;
          }
          return true;
        });

        if (filteredStudents.length === 0 && (query !== '' || filterStatus !== 'all')) {
          return null;
        }

        return {
          ...team,
          students: filteredStudents
        };
      })
      .filter(Boolean) as typeof teamSummaries;
  }, [teamSummaries, filterTeam, filterStatus, searchQuery]);

  const flatFilteredStudents = useMemo(() => {
    return filteredTeamSummaries.flatMap(t => t.students);
  }, [filteredTeamSummaries]);

  const watchlistStudents = useMemo(() => {
    return allStudentTrajectories.filter(s => 
      s.currentFlagStatus === 'at_risk' || 
      s.currentFlagStatus === 'watch' || 
      s.currentFlagStatus === 'recovered'
    );
  }, [allStudentTrajectories]);

  const rubricFields: GradingScaleField[] = useMemo(() => {
    if (activeClass.fields && activeClass.fields.length > 0) {
      return activeClass.fields;
    }
    return [
      { id: 'quality', name: 'Work Quality & Contribution', min: 1, max: 5, weight: 1 },
      { id: 'collaboration', name: 'Communication & Teamwork', min: 1, max: 5, weight: 1 },
      { id: 'reliability', name: 'Reliability & Delivery', min: 1, max: 5, weight: 1 }
    ];
  }, [activeClass.fields]);

  const studentMap = useMemo(() => {
    const map = new Map<string, string>();
    activeClass.students.forEach(s => map.set(s.id, s.name));
    return map;
  }, [activeClass.students]);

  // Launch Round Handler
  const handleLaunchRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onToast('Please enter a milestone title.', 'warning');
      return;
    }
    createSubPeerReviewRound(activeClass.id, {
      title: newTitle.trim(),
      deadline: newDeadline || null,
      weight: newWeight,
      customNote: newNote.trim()
    });
    setNewTitle('');
    setNewDeadline('');
    setNewWeight(1);
    setNewNote('');
    setIsLaunchModalOpen(false);
    onToast(`Milestone "${newTitle.trim()}" created.`, 'success');
  };

  // Save Round Edit
  const handleSaveEditRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRound) return;
    updateSubPeerReviewRound(activeClass.id, editingRound.id, {
      title: editTitle.trim() || editingRound.title,
      deadline: editDeadline || null,
      weight: editWeight,
      status: editStatus,
      customNote: editNote.trim()
    });
    setIsEditRoundModalOpen(false);
    setEditingRound(null);
    onToast('Milestone checkpoint updated.', 'success');
  };

  // Save Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSubPeerReviewConfig(activeClass.id, {
      atRiskDeltaThreshold: configAtRiskDelta,
      atRiskScoreCutoff: configAtRiskScore,
      watchDeltaThreshold: configWatchDelta,
      thrivingDeltaThreshold: configThrivingDelta,
      growthMinDelta: configGrowthDelta
    });
    onToast('Detection thresholds saved.', 'success');
  };

  // Reset Config
  const handleResetConfigDefaults = () => {
    setConfigAtRiskDelta(DEFAULT_SUB_PEER_REVIEW_CONFIG.atRiskDeltaThreshold);
    setConfigAtRiskScore(DEFAULT_SUB_PEER_REVIEW_CONFIG.atRiskScoreCutoff);
    setConfigWatchDelta(DEFAULT_SUB_PEER_REVIEW_CONFIG.watchDeltaThreshold);
    setConfigThrivingDelta(DEFAULT_SUB_PEER_REVIEW_CONFIG.thrivingDeltaThreshold);
    setConfigGrowthDelta(DEFAULT_SUB_PEER_REVIEW_CONFIG.growthMinDelta);
    updateSubPeerReviewConfig(activeClass.id, DEFAULT_SUB_PEER_REVIEW_CONFIG);
    onToast('Reset thresholds to standard defaults.', 'info');
  };

  // Override Status
  const handleOverrideStatus = (studentId: string, status: StudentSubReviewFlagStatus | 'auto') => {
    if (status === 'auto') {
      updateSubPeerReviewManualOverride(activeClass.id, studentId, null);
      onToast('Restored automatic status calculation.', 'info');
    } else {
      updateSubPeerReviewManualOverride(activeClass.id, studentId, status);
      onToast(`Student status overridden to "${status.replace('_', ' ').toUpperCase()}".`, 'success');
    }
  };

  // Edit Review
  const handleOpenEditReview = (
    roundId: string,
    roundTitle: string,
    studentId: string,
    studentName: string,
    review: Review
  ) => {
    setEditingReviewModal({
      roundId,
      roundTitle,
      studentId,
      studentName,
      review
    });
    setEditReviewScores({ ...review.scores });
    setEditReviewStrengths(review.strengthsText || '');
    setEditReviewGrowth(review.growthText || '');
  };

  const handleSaveEditReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReviewModal) return;

    updateSubPeerReviewEvaluation(
      activeClass.id,
      editingReviewModal.roundId,
      editingReviewModal.review.reviewerId,
      editingReviewModal.studentId,
      {
        scores: editReviewScores,
        strengthsText: editReviewStrengths.trim(),
        growthText: editReviewGrowth.trim()
      }
    );
    setEditingReviewModal(null);
    onToast('Review updated and scores recalculated.', 'success');
  };

  const handleDeleteIndividualReview = (roundId: string, reviewerId: string, recipientId: string) => {
    const reviewerName = studentMap.get(reviewerId) || 'Peer';
    if (window.confirm(`Delete review from "${reviewerName}"? Scores will recalculate.`)) {
      deleteSubPeerReviewEvaluation(activeClass.id, roundId, reviewerId, recipientId);
      onToast(`Deleted review from ${reviewerName}.`, 'info');
    }
  };

  const handleExecuteClearAll = () => {
    if (clearConfirmationText.trim().toLowerCase() !== 'clear all') {
      onToast('Please type "clear all" to confirm.', 'warning');
      return;
    }
    clearAllSubPeerReviews(activeClass.id);
    setIsClearAllModalOpen(false);
    setClearConfirmationText('');
    onToast('All sub-review data cleared.', 'info');
  };

  const handleExportCSV = () => {
    if (rounds.length === 0) {
      onToast('No milestones available to export.', 'warning');
      return;
    }

    const headers = [
      'Student Name',
      'Email',
      'Team',
      'Status',
      'Overridden',
      'Cumulative Score %',
      'Team Avg %',
      'Delta %',
      ...rounds.map(r => `"${r.title.replace(/"/g, '""')} (Score %)"`),
      ...rounds.map(r => `"${r.title.replace(/"/g, '""')} (Delta %)"`)
    ];

    const rows: string[][] = [];

    metrics.allStudentTrajectories.forEach(student => {
      const row: string[] = [
        `"${student.studentName.replace(/"/g, '""')}"`,
        `"${(student.studentEmail || '').replace(/"/g, '""')}"`,
        `"${student.groupName.replace(/"/g, '""')}"`,
        student.currentFlagStatus.toUpperCase(),
        student.isManuallyOverridden ? 'YES' : 'NO',
        student.cumulativeScorePct !== null ? `${student.cumulativeScorePct}%` : 'N/A',
        student.cumulativeTeamAvgPct !== null ? `${student.cumulativeTeamAvgPct}%` : 'N/A',
        student.cumulativeDeltaPct !== null ? `${student.cumulativeDeltaPct > 0 ? '+' : ''}${student.cumulativeDeltaPct}%` : 'N/A'
      ];

      rounds.forEach(r => {
        const ev = student.roundEvaluations.find(e => e.roundId === r.id);
        row.push(ev?.scorePct !== null && ev?.scorePct !== undefined ? `${ev.scorePct}%` : 'N/A');
        row.push(ev?.deltaPct !== null && ev?.deltaPct !== undefined ? `${ev.deltaPct > 0 ? '+' : ''}${ev.deltaPct}%` : 'N/A');
      });

      rows.push(row);
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = activeClass.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${safeName}_Sub_Peer_Reviews.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Exported CSV dataset.', 'success');
  };

  const renderStatusBadge = (student: StudentSubReviewTrajectory) => {
    const status = student.currentFlagStatus;

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {status === 'at_risk' && (
          <span className="badge badge-rose" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', gap: '3px' }}>
            <ShieldAlert size={11} /> At Risk
          </span>
        )}
        {status === 'recovered' && (
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', gap: '3px' }}>
            <Sparkles size={11} /> Recovered
          </span>
        )}
        {status === 'thriving' && (
          <span className="badge badge-indigo" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', gap: '3px' }}>
            <Award size={11} /> Top
          </span>
        )}
        {status === 'watch' && (
          <span className="badge badge-amber" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px' }}>
            Watch
          </span>
        )}
        {status === 'on_track' && (
          <span className="badge badge-teal" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px' }}>
            On Track
          </span>
        )}
        {status === 'pending' && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Pending
          </span>
        )}

        {student.isManuallyOverridden && (
          <span 
            title="Instructor manually set this status."
            style={{ 
              fontSize: '0.62rem', 
              fontWeight: 800, 
              color: '#8b5cf6', 
              backgroundColor: 'rgba(139, 92, 246, 0.1)', 
              padding: '1px 4px', 
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <UserCheck size={9} /> Manual
          </span>
        )}
      </div>
    );
  };

  const renderScoreCapsule = (scorePct: number | null, deltaPct: number | null) => {
    if (scorePct === null) {
      return <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>—</span>;
    }

    const isCritical = (deltaPct !== null && deltaPct <= configAtRiskDelta) || scorePct < configAtRiskScore;
    const isWatch = !isCritical && deltaPct !== null && deltaPct <= configWatchDelta;
    const isAhead = deltaPct !== null && deltaPct >= configThrivingDelta;

    const color = isCritical ? '#ef4444' : isWatch ? '#b45309' : isAhead ? '#059669' : 'var(--text-primary)';

    return (
      <div
        className="subpeer-score-pill"
        title={`Score: ${scorePct}% • Delta: ${deltaPct !== null ? `${deltaPct > 0 ? '+' : ''}${deltaPct}% vs team` : 'N/A'}`}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color }}>
          {scorePct}%
        </span>
        {deltaPct !== null && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: deltaPct < 0 ? '#ef4444' : '#10b981', display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
            {deltaPct > 0 ? <TrendingUp size={8} /> : deltaPct < 0 ? <TrendingDown size={8} /> : null}
            {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="sub-peer-review-studio" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 1: Minimal Action & Status Bar (No redundant duplicate card banner)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.55rem 0.85rem',
          backgroundColor: 'var(--bg-app)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
            Milestones
          </span>
          <span className="badge badge-secondary" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
            {totalRounds}
          </span>

          {activeRound ? (
            <span style={{ fontSize: '0.74rem', color: '#0d9488', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span className="subpeer-pulse-beacon beacon-teal" />
              Active: {activeRound.title}
              {activeRound.deadline && (
                <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>
                  • Due {new Date(activeRound.deadline).toLocaleDateString()}
                </span>
              )}
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              (All closed)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            id="subpeer-launch-btn"
            type="button"
            className="btn btn-teal btn-sm"
            onClick={() => {
              setNewTitle(`Sprint ${rounds.length + 1}: Checkpoint`);
              const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
              setNewDeadline(nextWeek);
              setNewWeight(1.0);
              setNewNote('');
              setIsLaunchModalOpen(true);
            }}
            style={{ height: '30px', fontSize: '0.76rem', fontWeight: 700, gap: '0.35rem', borderRadius: '6px' }}
          >
            <Plus size={14} /> Launch Checkpoint
          </button>

          {rounds.length > 0 && (
            <button
              id="subpeer-export-csv-btn"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCSV}
              style={{ height: '30px', fontSize: '0.74rem', gap: '0.35rem', borderRadius: '6px' }}
              title="Export CSV"
            >
              <Download size={13} /> Export CSV
            </button>
          )}

          {rounds.length === 0 && (
            <button
              id="subpeer-seed-demo-btn"
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                seedSampleSubPeerReviews(activeClass.id);
                onToast('Loaded sample multi-sprint milestones.', 'success');
              }}
              style={{ height: '30px', fontSize: '0.74rem', gap: '0.35rem', borderRadius: '6px' }}
            >
              <Sparkles size={13} className="text-amber" /> Seed Demo
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 2: Clean 4-Metric Grid (Matching exact app theme)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
        
        {/* Metric 1: Checkpoints */}
        <div
          className="subpeer-kpi-card"
          onClick={() => setActiveTab('milestones')}
          title="Click to view all milestones"
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Milestones</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="subpeer-tnum" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {totalRounds}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {activeRound ? '1 Active' : 'All Closed'}
            </span>
          </div>
        </div>

        {/* Metric 2: At-Risk */}
        <div
          className="subpeer-kpi-card"
          onClick={() => {
            setActiveTab('matrix');
            setFilterStatus(filterStatus === 'at_risk' ? 'all' : 'at_risk');
          }}
          style={{
            borderColor: flaggedAtRiskCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
            backgroundColor: flaggedAtRiskCount > 0 ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-app)'
          }}
          title="Click to filter students at risk"
        >
          <div style={{ fontSize: '0.72rem', color: flaggedAtRiskCount > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>At Risk</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="subpeer-tnum" style={{ fontSize: '1.45rem', fontWeight: 900, color: flaggedAtRiskCount > 0 ? '#ef4444' : '#10b981' }}>
              {flaggedAtRiskCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: flaggedAtRiskCount > 0 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 600 }}>
              {flaggedAtRiskCount > 0 ? 'needs check-in' : 'all clear'}
            </span>
          </div>
        </div>

        {/* Metric 3: Turnaround Recoveries */}
        <div
          className="subpeer-kpi-card"
          onClick={() => {
            setActiveTab('matrix');
            setFilterStatus(filterStatus === 'recovered' ? 'all' : 'recovered');
          }}
          style={{
            borderColor: recoveredCount > 0 ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
            backgroundColor: recoveredCount > 0 ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-app)'
          }}
          title="Click to filter recovered students"
        >
          <div style={{ fontSize: '0.72rem', color: recoveredCount > 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 600 }}>Turnarounds</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="subpeer-tnum" style={{ fontSize: '1.45rem', fontWeight: 900, color: recoveredCount > 0 ? '#10b981' : 'var(--text-primary)' }}>
              {recoveredCount}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              rebounded
            </span>
          </div>
        </div>

        {/* Metric 4: Formative Average */}
        <div className="subpeer-kpi-card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cohort Mean</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span className="subpeer-tnum" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {classCumulativeScorePct !== null ? `${classCumulativeScorePct}%` : '—'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {classCumulativeScorePct !== null ? 'weighted avg' : 'pending reviews'}
            </span>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION 3: Unified Segmented Tab Switcher (Matching app design system)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-app)',
          padding: '2px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          width: 'fit-content'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'matrix' ? 800 : 500,
            backgroundColor: activeTab === 'matrix' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'matrix' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Activity size={12} className="text-teal" />
          <span>Matrix</span>
          <span className="badge badge-secondary" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
            {metrics.totalStudents}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'milestones' ? 800 : 500,
            backgroundColor: activeTab === 'milestones' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'milestones' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'milestones' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Calendar size={12} className="text-indigo" />
          <span>Checkpoints</span>
          <span className="badge badge-secondary" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
            {totalRounds}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('watchlist')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'watchlist' ? 800 : 500,
            backgroundColor: activeTab === 'watchlist' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'watchlist' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'watchlist' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <ShieldAlert size={12} className={watchlistStudents.length > 0 ? 'text-rose' : 'text-muted'} />
          <span>Watchlist</span>
          {watchlistStudents.length > 0 && (
            <span className="badge badge-rose" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
              {watchlistStudents.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: activeTab === 'settings' ? 800 : 500,
            backgroundColor: activeTab === 'settings' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: activeTab === 'settings' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Sliders size={12} />
          <span>Thresholds</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 1: Student Trajectories & Team Matrix
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Streamlined Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-app)',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="matrix-search"
                  name="matrix-search"
                  type="text"
                  placeholder="Search student or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '30px', height: '32px', fontSize: '0.78rem', borderRadius: '6px' }}
                />
              </div>

              <select
                id="matrix-team-select"
                name="matrix-team-select"
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="form-select form-select-sm"
                style={{ width: '150px', height: '32px', fontSize: '0.78rem', borderRadius: '6px' }}
              >
                <option value="all">All Teams ({teamSummaries.length})</option>
                {teamSummaries.map(t => (
                  <option key={t.groupName} value={t.groupName}>{t.groupName}</option>
                ))}
              </select>

              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('teams')}
                  style={{
                    height: '32px',
                    padding: '0 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: viewMode === 'teams' ? 800 : 500,
                    backgroundColor: viewMode === 'teams' ? 'var(--primary)' : 'var(--bg-surface)',
                    color: viewMode === 'teams' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Teams
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('flat')}
                  style={{
                    height: '32px',
                    padding: '0 0.65rem',
                    fontSize: '0.74rem',
                    fontWeight: viewMode === 'flat' ? 800 : 500,
                    backgroundColor: viewMode === 'flat' ? 'var(--primary)' : 'var(--bg-surface)',
                    color: viewMode === 'flat' ? '#ffffff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  List
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter:</span>
              <select
                id="matrix-status-filter"
                name="matrix-status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="form-select form-select-sm"
                style={{ width: '135px', height: '32px', fontSize: '0.76rem', borderRadius: '6px' }}
              >
                <option value="all">All ({metrics.totalStudents})</option>
                <option value="at_risk">At Risk ({flaggedAtRiskCount})</option>
                <option value="recovered">Recovered ({recoveredCount})</option>
                <option value="thriving">Top ({thrivingCount})</option>
                <option value="overridden">Overridden</option>
              </select>
            </div>
          </div>

          {/* Matrix Content */}
          {filteredTeamSummaries.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
              <Target size={30} style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>No students match current filters</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Adjust search or filters to see student progress</div>
            </div>
          ) : viewMode === 'teams' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredTeamSummaries.map(team => {
                const hasTeamFlag = team.activeFlaggedCount > 0;

                return (
                  <div
                    key={team.groupName}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '10px',
                      border: hasTeamFlag ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Compact Team Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 1rem',
                        backgroundColor: hasTeamFlag ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-app)',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {team.groupName}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          • {team.memberCount} members • Team Avg: <strong>{team.cumulativeTeamScorePct !== null ? `${team.cumulativeTeamScorePct}%` : 'Pending'}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {team.activeFlaggedCount > 0 && (
                          <span className="badge badge-rose" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            {team.activeFlaggedCount} At Risk
                          </span>
                        )}
                        {team.recoveredCount > 0 && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            {team.recoveredCount} Recovered
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team Students Table */}
                    <div style={{ overflowX: 'auto', position: 'relative' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <th className="subpeer-sticky-col" style={{ padding: '0.55rem 0.85rem', minWidth: '190px', width: '190px' }}>
                              Student
                            </th>
                            <th style={{ padding: '0.55rem 0.65rem', minWidth: '100px' }}>Status</th>
                            <th style={{ padding: '0.55rem 0.55rem', textAlign: 'center', minWidth: '95px' }}>Trajectory</th>
                            {rounds.map((r, rIdx) => (
                              <th key={r.id} style={{ padding: '0.55rem 0.5rem', textAlign: 'center', minWidth: '85px' }} title={r.title}>
                                <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                                  S{rIdx + 1}
                                  {r.status === 'active' && <span style={{ marginLeft: '3px', color: '#0d9488' }}>●</span>}
                                </div>
                              </th>
                            ))}
                            <th style={{ padding: '0.55rem 0.65rem', textAlign: 'center', minWidth: '85px' }}>Cumulative</th>
                            <th style={{ padding: '0.55rem 0.85rem', textAlign: 'right', minWidth: '95px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {team.students.map(student => {
                            const isAtRisk = student.currentFlagStatus === 'at_risk';

                            return (
                              <tr
                                key={student.studentId}
                                style={{
                                  borderBottom: '1px solid var(--border-color)',
                                  backgroundColor: isAtRisk ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                                }}
                              >
                                {/* Sticky Student Profile */}
                                <td className="subpeer-sticky-col" style={{ padding: '0.55rem 0.85rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div
                                      style={{
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        backgroundColor: isAtRisk ? '#ef4444' : 'var(--primary)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.7rem',
                                        flexShrink: 0
                                      }}
                                    >
                                      {student.studentName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                      <div style={{ fontWeight: 700, color: isAtRisk ? '#dc2626' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                        {student.studentName}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Status */}
                                <td style={{ padding: '0.55rem 0.65rem' }}>
                                  {renderStatusBadge(student)}
                                </td>

                                {/* Trajectory Sparkline */}
                                <td style={{ padding: '0.55rem 0.55rem', textAlign: 'center' }}>
                                  <TrajectorySparkline
                                    points={student.trendPoints}
                                    teamAvgPct={student.cumulativeTeamAvgPct}
                                    width={85}
                                    height={24}
                                  />
                                </td>

                                {/* Round Scores */}
                                {rounds.map(r => {
                                  const ev = student.roundEvaluations.find(e => e.roundId === r.id);
                                  return (
                                    <td key={r.id} style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                                      {renderScoreCapsule(ev?.scorePct ?? null, ev?.deltaPct ?? null)}
                                    </td>
                                  );
                                })}

                                {/* Cumulative */}
                                <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                                  {student.cumulativeScorePct !== null ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isAtRisk ? '#ef4444' : 'var(--text-primary)' }}>
                                        {student.cumulativeScorePct}%
                                      </span>
                                      {student.cumulativeDeltaPct !== null && (
                                        <span style={{ fontSize: '0.66rem', fontWeight: 600, color: student.cumulativeDeltaPct < 0 ? '#ef4444' : '#10b981' }}>
                                          {student.cumulativeDeltaPct > 0 ? `+${student.cumulativeDeltaPct}%` : `${student.cumulativeDeltaPct}%`}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                  )}
                                </td>

                                {/* Quick Inspect Action */}
                                <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setInspectingStudentId(student.studentId)}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      height: '26px',
                                      padding: '0 0.55rem',
                                      borderRadius: '5px',
                                      gap: '0.2rem'
                                    }}
                                  >
                                    <Eye size={12} className="text-teal" /> Inspect
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat Table View */
            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th className="subpeer-sticky-col" style={{ padding: '0.6rem 0.85rem', minWidth: '190px' }}>
                        Student
                      </th>
                      <th style={{ padding: '0.6rem 0.65rem', minWidth: '90px' }}>Team</th>
                      <th style={{ padding: '0.6rem 0.65rem', minWidth: '100px' }}>Status</th>
                      <th style={{ padding: '0.6rem 0.55rem', textAlign: 'center', minWidth: '95px' }}>Trajectory</th>
                      {rounds.map((r, rIdx) => (
                        <th key={r.id} style={{ padding: '0.6rem 0.5rem', textAlign: 'center', minWidth: '80px' }}>
                          S{rIdx + 1}
                        </th>
                      ))}
                      <th style={{ padding: '0.6rem 0.65rem', textAlign: 'center', minWidth: '85px' }}>Cumulative</th>
                      <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', minWidth: '90px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatFilteredStudents.map(student => {
                      const isAtRisk = student.currentFlagStatus === 'at_risk';

                      return (
                        <tr
                          key={student.studentId}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: isAtRisk ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                          }}
                        >
                          <td className="subpeer-sticky-col" style={{ padding: '0.55rem 0.85rem' }}>
                            <span style={{ fontWeight: 700, color: isAtRisk ? '#dc2626' : 'var(--text-primary)' }}>
                              {student.studentName}
                            </span>
                          </td>

                          <td style={{ padding: '0.55rem 0.65rem' }}>
                            <span className="badge badge-secondary" style={{ fontSize: '0.68rem' }}>{student.groupName}</span>
                          </td>

                          <td style={{ padding: '0.55rem 0.65rem' }}>
                            {renderStatusBadge(student)}
                          </td>

                          <td style={{ padding: '0.55rem 0.55rem', textAlign: 'center' }}>
                            <TrajectorySparkline
                              points={student.trendPoints}
                              teamAvgPct={student.cumulativeTeamAvgPct}
                              width={85}
                              height={24}
                            />
                          </td>

                          {rounds.map(r => {
                            const ev = student.roundEvaluations.find(e => e.roundId === r.id);
                            return (
                              <td key={r.id} style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                                {renderScoreCapsule(ev?.scorePct ?? null, ev?.deltaPct ?? null)}
                              </td>
                            );
                          })}

                          <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center', fontWeight: 800 }}>
                            {student.cumulativeScorePct !== null ? `${student.cumulativeScorePct}%` : '—'}
                          </td>

                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setInspectingStudentId(student.studentId)}
                              style={{ height: '26px', fontSize: '0.72rem', padding: '0 0.55rem' }}
                            >
                              <Eye size={12} className="text-teal" /> Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 2: Milestone Checkpoints Manager
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'milestones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Checkpoints ({rounds.length})
            </div>

            <button
              id="subpeer-add-checkpoint-btn"
              type="button"
              className="btn btn-teal btn-sm"
              onClick={() => {
                setNewTitle(`Sprint ${rounds.length + 1}: Checkpoint`);
                const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
                setNewDeadline(nextWeek);
                setNewWeight(1.0);
                setNewNote('');
                setIsLaunchModalOpen(true);
              }}
              style={{ height: '30px', fontSize: '0.76rem', fontWeight: 700 }}
            >
              <Plus size={13} /> Add Checkpoint
            </button>
          </div>

          {rounds.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
              <Calendar size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>No Checkpoints Launched</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Create your first milestone round to collect student reviews.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {rounds.map((round, idx) => {
                const isActive = round.status === 'active';

                return (
                  <div
                    key={round.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '10px',
                      border: isActive ? '1.5px solid #0d9488' : '1px solid var(--border-color)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          #{idx + 1} {round.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {round.deadline ? `Due ${new Date(round.deadline).toLocaleDateString()}` : 'No deadline'} • {round.weight || 1}x weight
                        </div>
                      </div>

                      <span className={`badge ${isActive ? 'badge-teal' : 'badge-secondary'}`} style={{ fontSize: '0.68rem' }}>
                        {isActive ? 'Active' : 'Archived'}
                      </span>
                    </div>

                    {round.customNote && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-app)', padding: '0.4rem 0.6rem', borderRadius: '5px' }}>
                        "{round.customNote}"
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <strong>{round.reviews.length}</strong> reviews submitted
                      </span>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const newStatus = isActive ? 'closed' : 'active';
                            updateSubPeerReviewRound(activeClass.id, round.id, { status: newStatus });
                          }}
                          style={{ height: '26px', fontSize: '0.7rem' }}
                        >
                          {isActive ? 'Close' : 'Reactivate'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingRound(round);
                            setEditTitle(round.title);
                            setEditDeadline(round.deadline ? round.deadline.slice(0, 10) : '');
                            setEditWeight(round.weight || 1);
                            setEditStatus(round.status);
                            setEditNote(round.customNote || '');
                            setIsEditRoundModalOpen(true);
                          }}
                          style={{ height: '26px', fontSize: '0.7rem' }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm text-rose"
                          onClick={() => {
                            if (window.confirm(`Delete "${round.title}"?`)) {
                              deleteSubPeerReviewRound(activeClass.id, round.id);
                            }
                          }}
                          style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.4rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 3: Early Intervention Watchlist
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'watchlist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Students Requiring Attention ({watchlistStudents.length})
          </div>

          {watchlistStudents.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
              <Sparkles size={32} style={{ color: '#10b981', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Watchlist is Clear!</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                All students are performing within acceptable team benchmarks.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
              {watchlistStudents.map(student => {
                const isAtRisk = student.currentFlagStatus === 'at_risk';
                const isRecovered = student.currentFlagStatus === 'recovered';

                return (
                  <div
                    key={student.studentId}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      borderLeft: isAtRisk 
                        ? '4px solid #ef4444' 
                        : isRecovered 
                          ? '4px solid #10b981' 
                          : '4px solid #f59e0b',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {student.studentName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {student.groupName} • {student.studentEmail || 'No email'}
                        </div>
                      </div>

                      {renderStatusBadge(student)}
                    </div>

                    <div style={{ fontSize: '0.76rem', color: isAtRisk ? '#b91c1c' : isRecovered ? '#047857' : '#b45309', fontWeight: 600 }}>
                      {isAtRisk && `Rated ${student.cumulativeDeltaPct !== null ? `${Math.abs(student.cumulativeDeltaPct)}%` : ''} below team average.`}
                      {isRecovered && `Turnaround: Performance risen back above team benchmark.`}
                      {!isAtRisk && !isRecovered && `Borderline: Slightly below team average (${student.cumulativeDeltaPct}%).`}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Score: <strong>{student.cumulativeScorePct !== null ? `${student.cumulativeScorePct}%` : 'N/A'}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {student.studentEmail && (
                          <a
                            href={`mailto:${encodeURIComponent(student.studentEmail)}?subject=${encodeURIComponent(`Peer Feedback Check-in: ${student.groupName}`)}&body=${encodeURIComponent(`Hi ${student.studentName},\n\nI wanted to reach out regarding formative peer review feedback. Let's do a brief check-in.\n\nBest,\nInstructor`)}`}
                            className="btn btn-secondary btn-sm"
                            style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.5rem', textDecoration: 'none' }}
                          >
                            <Mail size={12} /> Email
                          </a>
                        )}

                        <button
                          type="button"
                          className="btn btn-teal btn-sm"
                          onClick={() => setInspectingStudentId(student.studentId)}
                          style={{ height: '26px', fontSize: '0.7rem', padding: '0 0.55rem' }}
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 4: Thresholds & Studio Controls
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '750px' }}>
          
          <form onSubmit={handleSaveConfig} style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Detection Thresholds
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 80px', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>At-Risk Delta</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flags students below team mean</div>
                </div>
                <input
                  type="range"
                  min={-25}
                  max={-2}
                  step={0.5}
                  value={configAtRiskDelta}
                  onChange={(e) => setConfigAtRiskDelta(parseFloat(e.target.value))}
                  className="subpeer-range-slider"
                  style={{ accentColor: '#ef4444' }}
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textAlign: 'right', color: '#ef4444' }}>
                  {configAtRiskDelta}%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 80px', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Score Cutoff</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Raw score cutoff regardless of team</div>
                </div>
                <input
                  type="range"
                  min={30}
                  max={80}
                  step={1}
                  value={configAtRiskScore}
                  onChange={(e) => setConfigAtRiskScore(parseFloat(e.target.value))}
                  className="subpeer-range-slider"
                  style={{ accentColor: '#ef4444' }}
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textAlign: 'right', color: '#ef4444' }}>
                  {configAtRiskScore}%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 80px', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Watchlist Delta</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Borderline observation threshold</div>
                </div>
                <input
                  type="range"
                  min={-15}
                  max={-1}
                  step={0.5}
                  value={configWatchDelta}
                  onChange={(e) => setConfigWatchDelta(parseFloat(e.target.value))}
                  className="subpeer-range-slider"
                  style={{ accentColor: '#f59e0b' }}
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textAlign: 'right', color: '#f59e0b' }}>
                  {configWatchDelta}%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 80px', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Top Contributor Delta</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pillar recognition above team mean</div>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={0.5}
                  value={configThrivingDelta}
                  onChange={(e) => setConfigThrivingDelta(parseFloat(e.target.value))}
                  className="subpeer-range-slider"
                  style={{ accentColor: '#6366f1' }}
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textAlign: 'right', color: '#6366f1' }}>
                  +{configThrivingDelta}%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 80px', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Turnaround Surge</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Improvement required to clear flag</div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={0.5}
                  value={configGrowthDelta}
                  onChange={(e) => setConfigGrowthDelta(parseFloat(e.target.value))}
                  className="subpeer-range-slider"
                  style={{ accentColor: '#10b981' }}
                />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, textAlign: 'right', color: '#10b981' }}>
                  +{configGrowthDelta}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetConfigDefaults}
                style={{ height: '32px' }}
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ height: '32px', fontWeight: 700 }}
              >
                Save Thresholds
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
              Reset or delete all milestone data for this class.
            </div>
            <button
              id="subpeer-clear-all-btn"
              type="button"
              className="btn btn-rose btn-sm"
              onClick={() => {
                setClearConfirmationText('');
                setIsClearAllModalOpen(true);
              }}
              style={{ height: '28px', fontSize: '0.72rem', fontWeight: 700 }}
            >
              Clear All Data
            </button>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL 1: Launch New Milestone Checkpoint (Presets removed)
          ═══════════════════════════════════════════════════════════════════════════ */}
      {isLaunchModalOpen && (
        <Modal
          isOpen={isLaunchModalOpen}
          onClose={() => setIsLaunchModalOpen(false)}
          title="Launch Milestone Checkpoint"
          maxWidth="460px"
        >
          <form onSubmit={handleLaunchRound} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.2rem 0' }}>
            <div>
              <label htmlFor="subpeer-new-title" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Milestone Title *
              </label>
              <input
                id="subpeer-new-title"
                name="subpeer-new-title"
                type="text"
                required
                placeholder="e.g. Sprint 2: Architecture & Prototype"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="form-input"
                style={{ height: '36px', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="subpeer-new-deadline" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Deadline (Optional)
                </label>
                <input
                  id="subpeer-new-deadline"
                  name="subpeer-new-deadline"
                  type="date"
                  value={newDeadline ? newDeadline.slice(0, 10) : ''}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="form-input"
                  style={{ height: '36px', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Weight
                </label>
                <div style={{ display: 'flex', gap: '4px', height: '36px' }}>
                  {[1, 1.5, 2].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setNewWeight(w)}
                      style={{
                        flex: 1,
                        borderRadius: '6px',
                        border: newWeight === w ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: newWeight === w ? 'var(--primary-light)' : 'var(--bg-app)',
                        color: newWeight === w ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: newWeight === w ? 800 : 500,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {w}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="subpeer-new-note" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Note for Students (Optional)
              </label>
              <textarea
                id="subpeer-new-note"
                name="subpeer-new-note"
                rows={2}
                placeholder="e.g. Focus on peer communication and delivery timeliness."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="form-input"
                style={{ minHeight: '60px', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsLaunchModalOpen(false)}
                style={{ height: '34px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-teal btn-sm"
                style={{ fontWeight: 700, height: '34px', gap: '0.35rem' }}
              >
                <Send size={13} /> Launch Checkpoint
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL 2: Student Inspector Modal
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeInspectingStudent && (
        <Modal
          isOpen={!!activeInspectingStudent}
          onClose={() => setInspectingStudentId(null)}
          title={`Student: ${activeInspectingStudent.studentName}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.2rem 0' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.94rem' }}>
                  {activeInspectingStudent.studentName}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {activeInspectingStudent.groupName} • {activeInspectingStudent.studentEmail || 'No email'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
                <select
                  aria-label="Student status override"
                  value={activeInspectingStudent.isManuallyOverridden ? (activeInspectingStudent.manualOverrideStatus || 'auto') : 'auto'}
                  onChange={(e) => handleOverrideStatus(activeInspectingStudent.studentId, e.target.value as any)}
                  className="form-select form-select-sm"
                  style={{ height: '32px', fontSize: '0.76rem', borderRadius: '6px', width: '150px' }}
                >
                  <option value="auto">Auto Calculated</option>
                  <option value="at_risk">Force At Risk</option>
                  <option value="recovered">Force Recovered</option>
                  <option value="on_track">Force On Track</option>
                  <option value="thriving">Force Top</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Formative Score</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {activeInspectingStudent.cumulativeScorePct !== null ? `${activeInspectingStudent.cumulativeScorePct}%` : 'N/A'}
                </div>
              </div>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Team Delta</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (activeInspectingStudent.cumulativeDeltaPct ?? 0) < 0 ? '#ef4444' : '#10b981' }}>
                  {activeInspectingStudent.cumulativeDeltaPct !== null ? `${activeInspectingStudent.cumulativeDeltaPct > 0 ? '+' : ''}${activeInspectingStudent.cumulativeDeltaPct}%` : 'N/A'}
                </div>
              </div>
              <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Trend</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'capitalize' }}>
                  {activeInspectingStudent.trendDirection}
                </div>
              </div>
            </div>

            <FullTrajectoryChart trajectory={activeInspectingStudent} rounds={rounds} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Milestone Records & Peer Feedback
              </div>

              {activeInspectingStudent.roundEvaluations.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                  No milestone evaluations submitted yet for this student.
                </div>
              ) : (
                activeInspectingStudent.roundEvaluations.map((ev) => {
                  const isExpanded = !!expandedRoundReviews[ev.roundId];
                  const rawReviews = ev.rawReviews || [];

                  return (
                    <div
                      key={ev.roundId}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{ev.roundTitle}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                            ({ev.reviewsCount} reviews)
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>
                            {ev.scorePct !== null ? `${ev.scorePct}%` : 'Pending'}
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setExpandedRoundReviews(p => ({ ...p, [ev.roundId]: !p[ev.roundId] }))}
                            style={{ height: '24px', fontSize: '0.68rem', padding: '0 0.45rem' }}
                          >
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {isExpanded ? 'Hide' : 'Reviews'}
                          </button>
                        </div>
                      </div>

                      {ev.strengths.length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                          <strong style={{ color: '#059669' }}>Strengths:</strong> {ev.strengths.join(' • ')}
                        </div>
                      )}
                      {ev.growthSuggestions.length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                          <strong style={{ color: '#d97706' }}>Guidance:</strong> {ev.growthSuggestions.join(' • ')}
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                          {rawReviews.map((rev, rIdx) => {
                            const reviewerName = studentMap.get(rev.reviewerId) || 'Peer';

                            return (
                              <div key={rIdx} style={{ padding: '0.55rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.76rem' }}>From: {reviewerName}</span>
                                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => handleOpenEditReview(ev.roundId, ev.roundTitle, activeInspectingStudent.studentId, activeInspectingStudent.studentName, rev)}
                                      style={{ height: '22px', fontSize: '0.66rem', padding: '0 0.4rem' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm text-rose"
                                      onClick={() => handleDeleteIndividualReview(ev.roundId, rev.reviewerId, activeInspectingStudent.studentId)}
                                      style={{ height: '22px', fontSize: '0.66rem', padding: '0 0.35rem' }}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                                {rev.growthText && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                    "{rev.growthText}"
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setInspectingStudentId(null)}
                style={{ height: '32px' }}
              >
                Close
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL 3: Edit Milestone Settings Modal
          ═══════════════════════════════════════════════════════════════════════════ */}
      {isEditRoundModalOpen && editingRound && (
        <Modal
          isOpen={isEditRoundModalOpen}
          onClose={() => {
            setIsEditRoundModalOpen(false);
            setEditingRound(null);
          }}
          title="Configure Checkpoint"
          maxWidth="460px"
        >
          <form onSubmit={handleSaveEditRound} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.2rem 0' }}>
            <div>
              <label htmlFor="edit-title" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Checkpoint Title
              </label>
              <input
                id="edit-title"
                name="edit-title"
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="form-input"
                style={{ height: '36px', borderRadius: '6px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label htmlFor="edit-status" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Status
                </label>
                <select
                  id="edit-status"
                  name="edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'closed')}
                  className="form-select form-select-sm"
                  style={{ height: '36px', borderRadius: '6px' }}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-weight" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Weight
                </label>
                <input
                  id="edit-weight"
                  name="edit-weight"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={editWeight}
                  onChange={(e) => setEditWeight(parseFloat(e.target.value) || 1)}
                  className="form-input"
                  style={{ height: '36px', borderRadius: '6px' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-deadline" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Deadline
              </label>
              <input
                id="edit-deadline"
                name="edit-deadline"
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="form-input"
                style={{ height: '36px', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label htmlFor="edit-note" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                Guidance Note
              </label>
              <textarea
                id="edit-note"
                name="edit-note"
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="form-input"
                style={{ minHeight: '60px', borderRadius: '6px', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsEditRoundModalOpen(false);
                  setEditingRound(null);
                }}
                style={{ height: '32px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ height: '32px', fontWeight: 700 }}
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL 4: Edit Individual Review Modal
          ═══════════════════════════════════════════════════════════════════════════ */}
      {editingReviewModal && (
        <Modal
          isOpen={!!editingReviewModal}
          onClose={() => setEditingReviewModal(null)}
          title={`Edit Review for ${editingReviewModal.studentName}`}
          maxWidth="460px"
        >
          <form onSubmit={handleSaveEditReview} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.2rem 0' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Adjust scores or guidance submitted by {studentMap.get(editingReviewModal.review.reviewerId) || 'Peer'}.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {rubricFields.map(f => {
                const currentVal = editReviewScores[f.id] ?? 3;
                return (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{f.name}</span>
                    <input
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={0.5}
                      value={currentVal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEditReviewScores(p => ({ ...p, [f.id]: isNaN(val) ? f.min : val }));
                      }}
                      className="form-input"
                      style={{ width: '60px', height: '30px', textAlign: 'center', fontWeight: 700, borderRadius: '5px' }}
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label htmlFor="edit-review-guidance" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Constructive Guidance
              </label>
              <textarea
                id="edit-review-guidance"
                name="edit-review-guidance"
                rows={2}
                value={editReviewGrowth}
                onChange={(e) => setEditReviewGrowth(e.target.value)}
                className="form-input"
                style={{ borderRadius: '6px', fontSize: '0.8rem', minHeight: '55px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingReviewModal(null)}
                style={{ height: '32px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ height: '32px', fontWeight: 700 }}
              >
                Save Review
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODAL 5: Clear All Data Confirmation Modal
          ═══════════════════════════════════════════════════════════════════════════ */}
      {isClearAllModalOpen && (
        <Modal
          isOpen={isClearAllModalOpen}
          onClose={() => setIsClearAllModalOpen(false)}
          title="Clear All Milestone Data"
          maxWidth="420px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.2rem 0' }}>
            <div style={{ fontSize: '0.78rem', color: '#dc2626', lineHeight: 1.45 }}>
              This will permanently delete all {rounds.length} milestone rounds, student ratings, and manual overrides.
            </div>

            <input
              type="text"
              value={clearConfirmationText}
              onChange={(e) => setClearConfirmationText(e.target.value)}
              placeholder='Type "clear all"'
              className="form-input"
              style={{ borderRadius: '6px', height: '36px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsClearAllModalOpen(false)}
                style={{ height: '32px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-rose btn-sm"
                disabled={clearConfirmationText.trim().toLowerCase() !== 'clear all'}
                onClick={handleExecuteClearAll}
                style={{ fontWeight: 700, height: '32px' }}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default SubPeerReviewStudio;
