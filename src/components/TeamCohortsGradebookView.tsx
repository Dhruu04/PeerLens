import React, { useState, useMemo } from 'react';
import {
  Users, CheckCircle2, Clock, Award, TrendingUp,
  Download, Mail, Copy, Check, Globe, Languages, GraduationCap,
  Smartphone, FileText, Edit2, RotateCcw,
  Search, X, AlertCircle
} from 'lucide-react';
import type { ClassData, Student } from '../utils/math';
import {
  calculateStudentMetrics,
  calculateStudentWebPAScore,
  normalizeNationality
} from '../utils/math';
import { exportRosterToExcel } from '../utils/csv';
import CustomSelect, { type CustomSelectOption } from './CustomSelect';
import Modal from './Modal';
import FeatureInfoButton from './FeatureInfoButton';

export interface TeamCohortsGradebookViewProps {
  activeClass: ClassData;
  gradebookSortBy: string;
  groupFilter: string;
  onSelectGroup?: (group: string) => void;
  onViewStudentDetails: (student: Student) => void;
  onPreviewStudent: (student: Student) => void;
  onOpenReport: (studentId: string) => void;
  onEditStudent: (student: Student) => void;
  onResetStudentReviews?: (classId: string, studentId: string) => void;
  onUpdateTeamBaseGrade?: (classId: string, groupName: string, grade: number) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  triggerConfirm?: (title: string, msg: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  baseGroupGrade: number;
  fudgeWeight: number;
  evalControls?: {
    allowSelfReview?: boolean;
    showPraiseTags?: boolean;
    showStrengthsFeedback?: boolean;
    showGrowthSuggestions?: boolean;
  };
}

export const TeamCohortsGradebookView: React.FC<TeamCohortsGradebookViewProps> = ({
  activeClass,
  onViewStudentDetails,
  onPreviewStudent,
  onOpenReport,
  onEditStudent,
  onResetStudentReviews,
  onUpdateTeamBaseGrade,
  addToast,
  triggerConfirm,
  baseGroupGrade,
  fudgeWeight
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'in_progress' | 'pending'>('all');
  const [teamSortBy, setTeamSortBy] = useState<'name-asc' | 'name-desc' | 'completion-desc' | 'completion-asc' | 'webpa-desc' | 'size-desc'>('name-asc');
  const [editingBaseGradeTeam, setEditingBaseGradeTeam] = useState<string | null>(null);
  const [tempBaseGrade, setTempBaseGrade] = useState<number>(baseGroupGrade);
  const [copiedLinkStudentId, setCopiedLinkStudentId] = useState<string | null>(null);
  const [copiedTeamEmailsGroup, setCopiedTeamEmailsGroup] = useState<string | null>(null);

  // Custom Confirmation Dialog State fallback
  const [localConfirmModal, setLocalConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const teamSortOptions: CustomSelectOption[] = useMemo(() => [
    { value: 'name-asc', label: 'Sort: Team Name (A → Z)' },
    { value: 'name-desc', label: 'Sort: Team Name (Z → A)' },
    { value: 'completion-desc', label: 'Sort: Completion (High → Low)' },
    { value: 'completion-asc', label: 'Sort: Completion (Low → High)' },
    { value: 'webpa-desc', label: 'Sort: WebPA Avg (High → Low)' },
    { value: 'size-desc', label: 'Sort: Size (Largest)' }
  ], []);

  const executeConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Yes, Proceed',
    cancelText = 'Cancel'
  ) => {
    if (triggerConfirm) {
      triggerConfirm(title, message, onConfirm, confirmText, cancelText);
    } else {
      setLocalConfirmModal({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => {
          onConfirm();
          setLocalConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    }
  };

  // Unique sorted group names
  const uniqueGroups = useMemo(() => {
    if (!activeClass?.students) return [];
    return Array.from(new Set(activeClass.students.map(s => s.groupName)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [activeClass?.students]);

  // Comprehensive aggregate metrics per team cohort
  const teamsData = useMemo(() => {
    if (!activeClass?.students) return [];
    return uniqueGroups.map(group => {
      const members = activeClass.students.filter(s => s.groupName === group);
      const submittedCount = members.filter(s => s.submitted).length;
      const completionPct = members.length > 0 ? Math.round((submittedCount / members.length) * 100) : 0;
      const memberIds = new Set(members.map(m => m.id));

      // Deliverable team base grade
      const teamBase = activeClass.teamBaseGrades?.[group] !== undefined
        ? activeClass.teamBaseGrades[group]
        : baseGroupGrade;

      // Intra-team review ratings exchanged
      const intraReviews = (activeClass.reviews || []).filter(
        r => memberIds.has(r.reviewerId) && memberIds.has(r.recipientId)
      );

      // WebPA scores for all members to compute team WebPA spread
      const memberWebPAs = members.map(m => {
        const { ratio, adjustedGrade } = calculateStudentWebPAScore(
          m.id,
          m.groupName,
          activeClass,
          teamBase,
          fudgeWeight
        );
        return { studentId: m.id, ratio, adjustedGrade };
      });

      const avgWebPA = memberWebPAs.length > 0
        ? Number((memberWebPAs.reduce((acc, curr) => acc + curr.ratio, 0) / memberWebPAs.length).toFixed(3))
        : 1.0;

      return {
        groupName: group,
        members,
        submittedCount,
        completionPct,
        teamBase,
        intraReviewsCount: intraReviews.length,
        avgWebPA,
        memberWebPAs
      };
    });
  }, [activeClass, uniqueGroups, baseGroupGrade, fudgeWeight]);

  // Filtered & sorted teams
  const filteredTeams = useMemo(() => {
    let result = teamsData;

    // Search query filter (matches team name or any student name/email/ID/major inside the team)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(team => {
        const teamMatch = team.groupName.toLowerCase().includes(q);
        const memberMatch = team.members.some(s =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.id || '').toLowerCase().includes(q) ||
          (s.degree || '').toLowerCase().includes(q) ||
          (s.university || '').toLowerCase().includes(q) ||
          (s.nationality || '').toLowerCase().includes(q)
        );
        return teamMatch || memberMatch;
      });
    }

    // Status filter
    if (statusFilter === 'complete') {
      result = result.filter(t => t.completionPct === 100);
    } else if (statusFilter === 'in_progress') {
      result = result.filter(t => t.completionPct > 0 && t.completionPct < 100);
    } else if (statusFilter === 'pending') {
      result = result.filter(t => t.completionPct === 0);
    }

    // Sorting
    return [...result].sort((a, b) => {
      switch (teamSortBy) {
        case 'name-asc':
          return a.groupName.localeCompare(b.groupName, undefined, { numeric: true, sensitivity: 'base' });
        case 'name-desc':
          return b.groupName.localeCompare(a.groupName, undefined, { numeric: true, sensitivity: 'base' });
        case 'completion-desc':
          return b.completionPct - a.completionPct || a.groupName.localeCompare(b.groupName);
        case 'completion-asc':
          return a.completionPct - b.completionPct || a.groupName.localeCompare(b.groupName);
        case 'webpa-desc':
          return b.avgWebPA - a.avgWebPA || a.groupName.localeCompare(b.groupName);
        case 'size-desc':
          return b.members.length - a.members.length || a.groupName.localeCompare(b.groupName);
        default:
          return 0;
      }
    });
  }, [teamsData, searchQuery, statusFilter, teamSortBy]);

  // Global cohort summary stats
  const cohortSummary = useMemo(() => {
    const totalTeams = teamsData.length;
    const totalStudents = teamsData.reduce((acc, t) => acc + t.members.length, 0);
    const totalSubmitted = teamsData.reduce((acc, t) => acc + t.submittedCount, 0);
    const completeTeamsCount = teamsData.filter(t => t.completionPct === 100).length;
    const inProgressTeamsCount = teamsData.filter(t => t.completionPct > 0 && t.completionPct < 100).length;
    const overallPct = totalStudents > 0 ? Math.round((totalSubmitted / totalStudents) * 100) : 0;
    return {
      totalTeams,
      totalStudents,
      totalSubmitted,
      completeTeamsCount,
      inProgressTeamsCount,
      overallPct
    };
  }, [teamsData]);

  // Handle committing team base grade
  const handleCommitBaseGrade = (groupName: string, grade: number) => {
    if (!onUpdateTeamBaseGrade) return;
    const cleanGrade = Math.max(0, Math.min(1000, Number(grade) || 0));
    onUpdateTeamBaseGrade(activeClass.id, groupName, cleanGrade);
    setEditingBaseGradeTeam(null);
    addToast(`Base deliverable mark for "${groupName}" updated to ${cleanGrade} pts!`, 'success');
  };

  // Copy private evaluation link
  const handleCopyLink = (student: Student) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/student?classId=${activeClass.id}&studentId=${student.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLinkStudentId(student.id);
        addToast(`Copied personal portal link for ${student.name}!`, 'info');
        setTimeout(() => setCopiedLinkStudentId(null), 2500);
      }).catch(() => {
        addToast('Failed to copy link to clipboard.', 'error');
      });
    }
  };

  // Copy all team emails
  const handleCopyTeamEmails = (members: Student[], groupName: string) => {
    const emails = members.map(m => m.email).filter(Boolean).join('; ');
    if (!emails) {
      addToast(`No email addresses on record for ${groupName}.`, 'warning');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emails).then(() => {
        setCopiedTeamEmailsGroup(groupName);
        addToast(`Copied ${members.length} team email addresses for ${groupName}!`, 'success');
        setTimeout(() => setCopiedTeamEmailsGroup(null), 2500);
      });
    }
  };

  // Direct mailto team
  const handleEmailTeam = (groupName: string, members: Student[]) => {
    const emails = members.map(m => m.email).filter(Boolean).join(';');
    if (!emails) {
      addToast(`No email addresses for ${groupName}.`, 'warning');
      return;
    }
    window.location.href = `mailto:${emails}?subject=${encodeURIComponent(`[${activeClass.name}] Team ${groupName} - Peer Evaluation Update`)}`;
  };

  // Export team Excel
  const handleExportTeamExcel = (team: any) => {
    try {
      exportRosterToExcel({
        ...activeClass,
        students: team.members
      });
      addToast(`Exported roster for ${team.groupName} to Excel!`, 'success');
    } catch {
      addToast('Failed to export team roster.', 'error');
    }
  };

  return (
    <div 
      className="team-cohorts-gradebook"
      data-quicklook-context="grading"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
    >
      {/* ─── 1. MINIMAL CONTROLS STRIP ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
          backgroundColor: 'var(--bg-app)',
          padding: '0.65rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Left: Search input */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search student, degree, or team..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              width: '100%',
              height: '32px',
              paddingLeft: '28px',
              paddingRight: searchQuery ? '28px' : '8px',
              fontSize: '0.78rem',
              borderRadius: '7px'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Center / Right: Filter pills & Sorts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Status Filter Segmented Control */}
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '7px', padding: '2px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                height: '26px',
                padding: '0 0.5rem',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'all' ? 700 : 550,
                border: 'none',
                borderRadius: '5px',
                backgroundColor: statusFilter === 'all' ? 'var(--primary)' : 'transparent',
                color: statusFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              All ({cohortSummary.totalTeams})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('complete')}
              style={{
                height: '26px',
                padding: '0 0.5rem',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'complete' ? 700 : 550,
                border: 'none',
                borderRadius: '5px',
                backgroundColor: statusFilter === 'complete' ? 'var(--accent-teal, #0d9488)' : 'transparent',
                color: statusFilter === 'complete' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              100% Done ({cohortSummary.completeTeamsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              style={{
                height: '26px',
                padding: '0 0.5rem',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'in_progress' ? 700 : 550,
                border: 'none',
                borderRadius: '5px',
                backgroundColor: statusFilter === 'in_progress' ? 'var(--accent-amber, #d97706)' : 'transparent',
                color: statusFilter === 'in_progress' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              style={{
                height: '26px',
                padding: '0 0.5rem',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'pending' ? 700 : 550,
                border: 'none',
                borderRadius: '5px',
                backgroundColor: statusFilter === 'pending' ? 'var(--text-secondary)' : 'transparent',
                color: statusFilter === 'pending' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Pending
            </button>
          </div>

          {/* Custom Team Sort Dropdown */}
          <CustomSelect
            options={teamSortOptions}
            value={teamSortBy}
            onChange={val => setTeamSortBy(val as any)}
            style={{ width: 'auto', minWidth: '190px' }}
            triggerStyle={{
              height: '30px',
              borderRadius: '7px',
              fontSize: '0.74rem',
              fontWeight: 600,
              padding: '0 0.55rem'
            }}
            dropdownStyle={{ zIndex: 110 }}
            dropdownMinWidth="215px"
            title="Sort team cards"
          />

          <FeatureInfoButton featureId="results-summary-sheet" size="sm" tooltipText="Team Cohorts Gradebook Guide" />
        </div>
      </div>

      {/* ─── 2. TEAMS COLUMN BOARD (AutoGroup Reference Style) ─── */}
      {filteredTeams.length === 0 ? (
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '12px',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <Users size={32} style={{ opacity: 0.35 }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>No teams match your active filters</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', maxWidth: '360px', lineHeight: 1.4 }}>
            Try resetting the search query or changing the evaluation status filter above.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            style={{ marginTop: '0.4rem', fontSize: '0.78rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '1rem',
            alignItems: 'start'
          }}
        >
          {filteredTeams.map(team => {
            const isAllComplete = team.completionPct === 100;

            return (
              <div
                key={team.groupName}
                data-group-name={team.groupName}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: isAllComplete ? '1px solid rgba(13, 148, 136, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
                }}
              >
                {/* ─── Team Header (Clean AutoGroup column header aesthetic) ─── */}
                <div
                  style={{
                    padding: '0.8rem 0.95rem 0.7rem 0.95rem',
                    backgroundColor: isAllComplete ? 'rgba(13, 148, 136, 0.04)' : 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem'
                  }}
                >
                  {/* Row 1: Title, members pill, action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          backgroundColor: isAllComplete ? 'rgba(13, 148, 136, 0.18)' : 'var(--primary-light)',
                          color: isAllComplete ? 'var(--accent-teal, #0d9488)' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Users size={13} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                        <strong
                          style={{
                            fontSize: '0.96rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={team.groupName}
                        >
                          {team.groupName}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.67rem',
                            fontWeight: 750,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>

                    {/* Right-aligned team actions: Copy Emails, Email, Export */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleCopyTeamEmails(team.members, team.groupName)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: copiedTeamEmailsGroup === team.groupName ? 'var(--accent-teal)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title={`Copy emails of all ${team.members.length} teammates`}
                        aria-label="Copy team emails"
                      >
                        {copiedTeamEmailsGroup === team.groupName ? <Check size={11} /> : <Copy size={11} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEmailTeam(team.groupName, team.members)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title={`Send email to all ${team.groupName} members`}
                        aria-label="Email team"
                      >
                        <Mail size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportTeamExcel(team)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title={`Download Excel spreadsheet for ${team.groupName}`}
                        aria-label="Export team spreadsheet"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Base mark & WebPA average */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Base Mark:</span>
                      {editingBaseGradeTeam === team.groupName ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <input
                            type="number"
                            min={0}
                            max={1000}
                            value={tempBaseGrade}
                            onChange={e => setTempBaseGrade(Number(e.target.value) || 0)}
                            className="form-input input-no-spin"
                            style={{ width: '48px', height: '22px', fontSize: '0.75rem', padding: '0 0.3rem', fontWeight: 800, textAlign: 'center' }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleCommitBaseGrade(team.groupName, tempBaseGrade)}
                            style={{ height: '22px', padding: '0 0.35rem', fontSize: '0.68rem', fontWeight: 700, borderRadius: '4px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBaseGradeTeam(null)}
                            style={{ height: '22px', padding: '0 0.25rem', fontSize: '0.68rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTempBaseGrade(team.teamBase);
                            setEditingBaseGradeTeam(team.groupName);
                          }}
                          style={{
                            border: '1px dashed var(--border-color)',
                            backgroundColor: 'var(--bg-surface)',
                            padding: '0.08rem 0.35rem',
                            borderRadius: '5px',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                          title="Click to edit deliverable base mark for this team"
                        >
                          <span>{team.teamBase} pts</span>
                          <Edit2 size={9} style={{ opacity: 0.6 }} />
                        </button>
                      )}
                    </div>

                    {/* WebPA Avg Multiplier */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 750,
                          padding: '0.08rem 0.35rem',
                          borderRadius: '5px',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                        title={`Team WebPA average multiplier (${team.avgWebPA.toFixed(2)}x)`}
                      >
                        <TrendingUp size={10} /> {team.avgWebPA.toFixed(2)}x avg
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Evaluation Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem', fontSize: '0.67rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        Evaluations: <strong style={{ color: 'var(--text-primary)' }}>{team.submittedCount}/{team.members.length}</strong>
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          color: isAllComplete ? 'var(--accent-teal, #0d9488)' : team.completionPct > 0 ? 'var(--accent-amber, #d97706)' : 'var(--text-muted)'
                        }}
                      >
                        {team.completionPct}% Done
                      </span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${team.completionPct}%`,
                          backgroundColor: isAllComplete ? 'var(--accent-teal, #0d9488)' : 'var(--accent-amber, #d97706)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ─── Team Student Members List (AutoGroup Minimal Aesthetic) ─── */}
                <div
                  style={{
                    padding: '0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}
                >
                  {team.members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      No students enrolled in this team.
                    </div>
                  ) : (
                    team.members.map((student) => {
                      const metrics = calculateStudentMetrics(student, activeClass);
                      const { ratio, adjustedGrade } = calculateStudentWebPAScore(
                        student.id,
                        student.groupName,
                        activeClass,
                        team.teamBase,
                        fudgeWeight
                      );

                      // WebPA badge color
                      const webpaColor = ratio >= 1.05
                        ? '#059669' // emerald
                        : ratio >= 0.98
                          ? 'var(--primary)'
                          : ratio >= 0.90
                            ? '#d97706' // amber
                            : '#e11d48'; // rose

                      const webpaBg = ratio >= 1.05
                        ? 'rgba(16, 185, 129, 0.1)'
                        : ratio >= 0.98
                          ? 'var(--primary-light)'
                          : ratio >= 0.90
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(225, 29, 72, 0.1)';

                      return (
                        <div
                          key={student.id}
                          data-student-id={student.id}
                          data-group-name={student.groupName}
                          style={{
                            padding: '0.65rem 0.8rem',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '9px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                            fontSize: '0.76rem',
                            transition: 'all 0.15s ease',
                            position: 'relative'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* ─── Top Row: Avatar, Name & Degree, Action Controls ─── */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                              {/* Avatar circle */}
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: student.submitted
                                    ? 'rgba(13, 148, 136, 0.12)'
                                    : 'var(--primary-light)',
                                  border: `1.5px solid ${student.submitted ? 'var(--accent-teal, #0d9488)' : 'var(--primary)'}`,
                                  color: student.submitted ? 'var(--accent-teal, #0d9488)' : 'var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  flexShrink: 0
                                }}
                              >
                                {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                              </div>

                              {/* Name, University & Degree */}
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                  <span
                                    onClick={() => onViewStudentDetails(student)}
                                    style={{
                                      fontWeight: 800,
                                      color: 'var(--text-primary)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.86rem',
                                      cursor: 'pointer'
                                    }}
                                    title={`Click to view full Performance Report for ${student.name}`}
                                  >
                                    {student.name}
                                  </span>

                                  {student.id && !student.id.startsWith('std_') && (
                                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                      #{student.id}
                                    </span>
                                  )}

                                  {Boolean(student.nameChangeCount && student.nameChangeCount > 0) && (
                                    <span className="badge badge-amber" style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem' }} title={`Original: "${student.originalName}"`}>
                                      Edited
                                    </span>
                                  )}

                                  {student.flaggedForReview && (
                                    <span className="badge badge-rose" style={{ fontSize: '0.58rem', padding: '0.05rem 0.3rem' }} title={student.suspiciousReason || 'Flagged for review'}>
                                      Flagged
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                  {student.degree && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      <GraduationCap size={11} style={{ opacity: 0.75, flexShrink: 0 }} />
                                      {student.degree}
                                    </span>
                                  )}
                                  {student.degree && student.university && <span>•</span>}
                                  {student.university && (
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {student.university}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Minimal Action Buttons (Report, Simulator, Copy Link, Edit, Reset) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                              {/* Open Report */}
                              <button
                                type="button"
                                onClick={() => onOpenReport(student.id)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Open individual Performance & PDF Report Card"
                                aria-label="Open performance report"
                              >
                                <FileText size={11} />
                              </button>

                              {/* Simulator portal button */}
                              <button
                                type="button"
                                onClick={() => onPreviewStudent(student)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--accent-teal)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Open student evaluation simulator"
                                aria-label="Simulator preview"
                              >
                                <Smartphone size={11} />
                              </button>

                              {/* Copy Link */}
                              <button
                                type="button"
                                onClick={() => handleCopyLink(student)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: copiedLinkStudentId === student.id ? 'var(--accent-teal)' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Copy personal evaluation link"
                                aria-label="Copy personal link"
                              >
                                {copiedLinkStudentId === student.id ? <Check size={11} /> : <Copy size={11} />}
                              </button>

                              {/* Edit Profile */}
                              <button
                                type="button"
                                onClick={() => onEditStudent(student)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '5px',
                                  border: '1px solid var(--border-color)',
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Edit student profile details"
                                aria-label="Edit student"
                              >
                                <Edit2 size={11} />
                              </button>

                              {/* Reset Submission */}
                              {student.submitted && onResetStudentReviews && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    executeConfirm(
                                      'Reset Student Review Submission',
                                      `Are you sure you want to reset the peer review submission for "${student.name}"? This will return their evaluation state to Pending and clear any ratings they submitted.`,
                                      () => onResetStudentReviews(activeClass.id, student.id),
                                      'Reset Submission',
                                      'Cancel'
                                    );
                                  }}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '5px',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                    color: '#d97706',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                  title="Reset submission"
                                  aria-label="Reset submission"
                                >
                                  <RotateCcw size={11} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* ─── Bottom Row: Metrics & Status (Minimal & Clean) ─── */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', paddingTop: '0.1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {/* WebPA Multiplier Pill */}
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '6px',
                                  backgroundColor: webpaBg,
                                  color: webpaColor,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                                title={`WebPA Factor Multiplier: ${ratio.toFixed(3)}x`}
                              >
                                <TrendingUp size={11} />
                                {metrics.reviewsReceived > 0 ? `${ratio.toFixed(2)}x` : '1.00x'}
                              </span>

                              {/* Calibrated Mark */}
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                                title={`Calibrated Final Mark: ${adjustedGrade} out of ${team.teamBase}`}
                              >
                                <Award size={11} style={{ color: 'var(--accent-amber)' }} />
                                {metrics.reviewsReceived > 0 ? `${adjustedGrade} / ${team.teamBase}` : '—'}
                              </span>

                              {/* Overall score if evaluated */}
                              {metrics.overallPercentage !== null && metrics.reviewsReceived > 0 && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '0.12rem 0.4rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                    color: 'var(--primary)'
                                  }}
                                  title={`Overall Weighted Peer Score: ${metrics.overallPercentage}%`}
                                >
                                  {metrics.overallPercentage}%
                                </span>
                              )}
                            </div>

                            {/* Status badge */}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '6px',
                                backgroundColor: student.submitted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: student.submitted ? '#059669' : '#d97706',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              {student.submitted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                              {student.submitted ? 'Submitted' : 'Pending'}
                            </span>
                          </div>

                          {/* ─── Demographics Row (AutoGroup dot-separated style) ─── */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.67rem', color: 'var(--text-muted)', paddingTop: '0.25rem', borderTop: '1px solid var(--border-color)' }}>
                            {student.nationality && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <Globe size={10} style={{ opacity: 0.75, flexShrink: 0 }} />
                                <span>{normalizeNationality(student.nationality)}</span>
                              </span>
                            )}

                            {student.gender && student.gender !== 'Prefer not to say' && (
                              <>
                                <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  {student.gender}
                                </span>
                              </>
                            )}

                            {student.englishProficiency && (
                              <>
                                <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                                  <Languages size={10} style={{ opacity: 0.75, flexShrink: 0 }} />
                                  <span>{student.englishProficiency.split(' ')[0]}</span>
                                </span>
                              </>
                            )}

                            {student.role && (
                              <>
                                <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                  {student.role}
                                </span>
                              </>
                            )}

                            {student.studentType && student.studentType !== 'Normal' && (
                              <>
                                <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                                <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>
                                  {student.studentType}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback Custom Confirmation Dialog Modal */}
      {localConfirmModal.isOpen && (
        <Modal
          isOpen={localConfirmModal.isOpen}
          onClose={() => setLocalConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={localConfirmModal.title}
          maxWidth="460px"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setLocalConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                {localConfirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-rose"
                onClick={localConfirmModal.onConfirm}
              >
                {localConfirmModal.confirmText || 'Confirm'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 6px rgba(239, 68, 68, 0.05)',
                marginBottom: '0.25rem'
              }}
            >
              <AlertCircle size={26} />
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {localConfirmModal.message}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TeamCohortsGradebookView;
