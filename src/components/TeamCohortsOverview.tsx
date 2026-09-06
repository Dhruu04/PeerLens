import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, CheckCircle, Clock, Mail, Copy, Check, Globe,
  Download, Smartphone, FileText, Edit2, RotateCcw,
  Filter, X, Award, TrendingUp, GraduationCap, ChevronDown, ChevronUp
} from 'lucide-react';
import type { ClassData, Student } from '../utils/math';
import { calculateStudentWebPAScore, normalizeNationality } from '../utils/math';
import { exportRosterToExcel, exportRosterToCSV } from '../utils/csv';

interface TeamCohortsOverviewProps {
  activeClass: ClassData;
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
  baseGroupGrade: number;
  fudgeWeight: number;
  onUpdateTeamBaseGrade: (classId: string, groupName: string, grade: number) => void;
  onPreviewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onOpenReport: (studentId: string) => void;
  onResetStudentReviews?: (classId: string, studentId: string) => void;
  onSendReminderEmail?: (student: Student) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  triggerConfirm?: (title: string, msg: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  firebaseConfig?: any;
  isCloudSynced?: boolean;
  user?: any;
}

export const TeamCohortsOverview: React.FC<TeamCohortsOverviewProps> = ({
  activeClass,
  selectedGroup,
  onSelectGroup,
  baseGroupGrade,
  fudgeWeight,
  onUpdateTeamBaseGrade,
  onPreviewStudent,
  onEditStudent,
  onOpenReport,
  onResetStudentReviews,
  addToast,
  triggerConfirm,
  firebaseConfig,
  isCloudSynced,
  user
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'in_progress' | 'pending'>('all');
  const [copiedEmailTeam, setCopiedEmailTeam] = useState(false);
  const [editingBaseGrade, setEditingBaseGrade] = useState<string | null>(null);
  const [tempBaseGrade, setTempBaseGrade] = useState<number>(100);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // Master Collapse / Expand listener
  useEffect(() => {
    const handleCollapse = () => setIsCollapsed(true);
    const handleExpand = () => setIsCollapsed(false);
    window.addEventListener('peerlens_collapse_all', handleCollapse);
    window.addEventListener('peerlens_expand_all', handleExpand);
    return () => {
      window.removeEventListener('peerlens_collapse_all', handleCollapse);
      window.removeEventListener('peerlens_expand_all', handleExpand);
    };
  }, []);

  // Derive unique team groups
  const uniqueGroups = useMemo(() => {
    if (!activeClass?.students) return [];
    return Array.from(new Set(activeClass.students.map(s => s.groupName)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [activeClass?.students]);

  // Aggregate statistics per team
  const teamsData = useMemo(() => {
    if (!activeClass?.students) return [];
    return uniqueGroups.map(group => {
      const members = activeClass.students.filter(s => s.groupName === group);
      const submittedCount = members.filter(s => s.submitted).length;
      const pct = members.length > 0 ? Math.round((submittedCount / members.length) * 100) : 0;
      const memberIds = new Set(members.map(m => m.id));

      // Reviews submitted by members of this team
      const reviewsByMembers = (activeClass.reviews || []).filter(r => memberIds.has(r.reviewerId));
      // Reviews received by members of this team
      const reviewsForMembers = (activeClass.reviews || []).filter(r => memberIds.has(r.recipientId));
      // Intra-team reviews (both reviewer and recipient in this team)
      const intraReviews = (activeClass.reviews || []).filter(
        r => memberIds.has(r.reviewerId) && memberIds.has(r.recipientId)
      );

      // Diversity metrics
      const nationalities = Array.from(
        new Set(members.map(m => normalizeNationality(m.nationality)).filter(Boolean))
      );
      const degrees = Array.from(
        new Set(members.map(m => m.degree?.trim()).filter(Boolean))
      );
      const internationalCount = members.filter(
        m => m.isInternational || m.isExchange || (m.studentType && m.studentType !== 'Normal')
      ).length;

      // Base grade for team
      const teamBase = activeClass.teamBaseGrades?.[group] ?? baseGroupGrade;

      let status: 'complete' | 'in_progress' | 'pending' = 'pending';
      if (members.length > 0 && submittedCount === members.length) {
        status = 'complete';
      } else if (submittedCount > 0) {
        status = 'in_progress';
      }

      return {
        group,
        members,
        submittedCount,
        pct,
        reviewsByMembers,
        reviewsForMembers,
        intraReviews,
        nationalities,
        degrees,
        internationalCount,
        teamBase,
        status
      };
    });
  }, [uniqueGroups, activeClass?.students, activeClass?.reviews, activeClass?.teamBaseGrades, baseGroupGrade]);

  // Filtered teams list based on search and status tabs
  const filteredTeams = useMemo(() => {
    return teamsData.filter(t => {
      // Status filter
      if (statusFilter === 'complete' && t.status !== 'complete') return false;
      if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
      if (statusFilter === 'pending' && t.status !== 'pending') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = t.group.toLowerCase().includes(q);
        const matchesMember = t.members.some(
          m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.degree && m.degree.toLowerCase().includes(q))
        );
        return matchesName || matchesMember;
      }
      return true;
    });
  }, [teamsData, statusFilter, searchQuery]);

  // Selected team object
  const activeTeamData = useMemo(() => {
    if (!selectedGroup || selectedGroup === 'All Groups') return null;
    return teamsData.find(t => t.group === selectedGroup) || null;
  }, [teamsData, selectedGroup]);

  // Class-wide cohort summary numbers
  const summary = useMemo(() => {
    const totalTeams = teamsData.length;
    const completeTeams = teamsData.filter(t => t.status === 'complete').length;
    const inProgressTeams = teamsData.filter(t => t.status === 'in_progress').length;
    const pendingTeams = teamsData.filter(t => t.status === 'pending').length;
    const totalStudentsInTeams = teamsData.reduce((acc, t) => acc + t.members.length, 0);
    const avgSize = totalTeams > 0 ? (totalStudentsInTeams / totalTeams).toFixed(1) : '0';
    return { totalTeams, completeTeams, inProgressTeams, pendingTeams, avgSize };
  }, [teamsData]);

  // Helper to generate a student's personal grading link
  const getStudentLink = (student: Student) => {
    let link = `${window.location.origin}${window.location.pathname}?classId=${activeClass.id}&studentId=${student.id}`;
    if (isCloudSynced && firebaseConfig && user) {
      try {
        const payload = {
          a: firebaseConfig.apiKey,
          p: firebaseConfig.projectId,
          d: firebaseConfig.authDomain,
          i: firebaseConfig.appId,
          o: user.uid
        };
        link += `&fb=${btoa(JSON.stringify(payload))}`;
      } catch (e) {
        // ignore
      }
    }
    return link;
  };

  // Copy all emails of a team
  const handleCopyTeamEmails = (members: Student[]) => {
    const emails = members.map(m => m.email).filter(Boolean).join(', ');
    if (!emails) {
      addToast('No member email addresses available for this team.', 'warning');
      return;
    }
    navigator.clipboard.writeText(emails);
    setCopiedEmailTeam(true);
    addToast(`Copied ${members.length} team email addresses to clipboard!`, 'success');
    setTimeout(() => setCopiedEmailTeam(false), 2500);
  };

  // Compose email to team
  const handleEmailTeam = (groupName: string, members: Student[]) => {
    const emails = members.map(m => m.email).filter(Boolean).join(',');
    if (!emails) {
      addToast('No member email addresses found to send email.', 'warning');
      return;
    }
    const subject = encodeURIComponent(`${activeClass.name} - ${groupName} Peer Evaluation Reminder`);
    window.open(`mailto:${emails}?subject=${subject}`);
  };

  // Export team to Excel
  const handleExportTeamExcel = (team: typeof teamsData[0]) => {
    exportRosterToExcel({
      ...activeClass,
      students: team.members
    });
    addToast(`Exported "${team.group}" roster to Excel!`, 'success');
  };

  // Export team to CSV
  const handleExportTeamCSV = (team: typeof teamsData[0]) => {
    exportRosterToCSV({
      ...activeClass,
      students: team.members
    });
    addToast(`Exported "${team.group}" roster to CSV!`, 'success');
  };

  // Handle committing new base grade for team
  const handleCommitBaseGrade = (groupName: string, val: number) => {
    const cleanVal = Math.min(1000, Math.max(0, val));
    onUpdateTeamBaseGrade(activeClass.id, groupName, cleanVal);
    setEditingBaseGrade(null);
    addToast(`Updated project base mark for "${groupName}" to ${cleanVal}!`, 'success');
  };

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg, 14px)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--card-bg)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}
    >
      {/* ─── 1. TOP HEADER & COHORT METRICS BAR ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h3
              className="card-title"
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-teal-light, rgba(45, 212, 191, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Users size={18} className="text-teal" />
              </div>
              Team Cohorts Overview &amp; Deep Dive
            </h3>
            <span
              className="badge badge-teal"
              style={{ fontSize: '0.76rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px' }}
            >
              {summary.totalTeams} Teams ({activeClass.students.length} Students)
            </span>
          </div>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              margin: '0.35rem 0 0 0',
              lineHeight: 1.4
            }}
          >
            Click any team to inspect full member profiles, evaluation completion, base grades, and intra-team ratings.
          </p>
        </div>

        {/* Global Cohort Status Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)'
            }}
            title="Teams where 100% of students have submitted peer evaluations"
          >
            <CheckCircle size={13} style={{ color: 'var(--accent-teal, #2dd4bf)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>{summary.completeTeams}</strong>
            <span style={{ color: 'var(--text-muted)' }}>Complete</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)'
            }}
            title="Teams with partial peer review submissions"
          >
            <Clock size={13} style={{ color: 'var(--accent-amber, #fbbf24)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>{summary.inProgressTeams}</strong>
            <span style={{ color: 'var(--text-muted)' }}>In Progress</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)'
            }}
            title="Average members per team cohort"
          >
            <Users size={13} style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Avg Size:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{summary.avgSize}</strong>
          </div>

          {selectedGroup && selectedGroup !== 'All Groups' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onSelectGroup('All Groups')}
              style={{
                height: '30px',
                fontSize: '0.75rem',
                gap: '0.35rem',
                color: 'var(--accent-rose)',
                fontWeight: 700
              }}
              title="Clear team selection and show all classroom students"
            >
              <X size={13} /> Reset Filter
            </button>
          )}

          {/* Expand / Collapse Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              height: '32px',
              fontSize: '0.75rem',
              fontWeight: 700,
              gap: '0.35rem',
              borderRadius: '8px'
            }}
            title={isCollapsed ? 'Expand Team Cohorts Overview & Deep Dive' : 'Collapse Team Cohorts Overview & Deep Dive'}
          >
            {isCollapsed ? (
              <>
                <ChevronDown size={14} /> Expand ({summary.totalTeams} Teams)
              </>
            ) : (
              <>
                <ChevronUp size={14} /> Collapse
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── 2. COLLAPSIBLE CARD BODY ─── */}
      {!isCollapsed && (
        <>
          {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'complete', 'in_progress', 'pending'] as const).map(tabKey => {
            const labels: Record<string, string> = {
              all: `All Teams (${summary.totalTeams})`,
              complete: `100% Done (${summary.completeTeams})`,
              in_progress: `In Progress (${summary.inProgressTeams})`,
              pending: `0% Done (${summary.pendingTeams})`
            };
            const isActive = statusFilter === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setStatusFilter(tabKey)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 800 : 600,
                  borderRadius: '20px',
                  border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {labels[tabKey]}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search teams or members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              height: '32px',
              fontSize: '0.78rem',
              padding: '0.2rem 1.8rem 0.2rem 0.65rem',
              borderRadius: '8px'
            }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 0
              }}
            >
              <X size={13} />
            </button>
          ) : (
            <Filter
              size={13}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      </div>

      {/* ─── 3. COHORT CARDS GRID ─── */}
      {filteredTeams.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)'
          }}
        >
          <Users size={28} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No team cohorts match the current filter.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '0.85rem'
          }}
        >
          {filteredTeams.map(t => {
            const isSelected = selectedGroup === t.group;
            return (
              <div
                key={t.group}
                onClick={() => onSelectGroup(isSelected ? 'All Groups' : t.group)}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(var(--primary-rgb, 99, 102, 241), 0.2), var(--shadow-sm)'
                    : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                {/* Header: Name + Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                    <strong
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={t.group}
                    >
                      {t.group}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}
                      title="Deliverable Base Mark"
                    >
                      Base: {t.teamBase}
                    </span>
                    <span
                      className="badge badge-teal"
                      style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem' }}
                    >
                      {t.members.length} {t.members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar for Submissions */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem',
                      fontSize: '0.7rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>
                      Evaluations: <strong style={{ color: 'var(--text-primary)' }}>{t.submittedCount}/{t.members.length}</strong>
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        color: t.pct === 100 ? 'var(--accent-teal, #2dd4bf)' : t.pct > 0 ? 'var(--accent-amber, #fbbf24)' : 'var(--text-muted)'
                      }}
                    >
                      {t.pct}% Done
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${t.pct}%`,
                        borderRadius: '3px',
                        backgroundColor:
                          t.pct === 100
                            ? 'var(--accent-teal, #2dd4bf)'
                            : t.pct > 0
                            ? 'var(--accent-amber, #fbbf24)'
                            : 'transparent',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Member Avatars Stack */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {t.members.slice(0, 5).map((m, idx) => {
                      const initials = m.name
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      return (
                        <div
                          key={m.id}
                          title={`${m.name} (${m.submitted ? 'Submitted' : 'Pending'})`}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: m.submitted ? 'var(--accent-teal-light, #14b8a622)' : 'rgba(255,255,255,0.08)',
                            border: `2px solid ${m.submitted ? 'var(--accent-teal, #2dd4bf)' : 'var(--border-color)'}`,
                            color: m.submitted ? 'var(--accent-teal, #2dd4bf)' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            marginLeft: idx === 0 ? 0 : '-6px',
                            zIndex: 5 - idx,
                            position: 'relative'
                          }}
                        >
                          {initials}
                        </div>
                      );
                    })}
                    {t.members.length > 5 && (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-card)',
                          border: '1.5px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          marginLeft: '-6px'
                        }}
                      >
                        +{t.members.length - 5}
                      </div>
                    )}
                  </div>

                  {/* Attributes Tag */}
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {t.nationalities.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                        title={`${t.nationalities.length} Nationalities: ${t.nationalities.join(', ')}`}
                      >
                        <Globe size={11} /> {t.nationalities.length}
                      </span>
                    )}
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Check size={11} /> Inspecting
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 4. DETAILED INSPECTOR PANEL FOR SELECTED TEAM ─── */}
      {activeTeamData && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg, 12px)',
            backgroundColor: 'var(--bg-app)',
            border: '2px solid var(--primary)',
            boxShadow: 'var(--shadow-premium, 0 10px 25px rgba(0,0,0,0.5))',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* A. Hero Banner for Selected Team */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--primary)',
                    backgroundColor: 'var(--primary-light)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px'
                  }}
                >
                  Active Cohort Deep Dive
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {activeTeamData.group}
                </h2>
                <span className="badge badge-teal" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                  {activeTeamData.members.length} {activeTeamData.members.length === 1 ? 'Student' : 'Students'}
                </span>
              </div>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {activeTeamData.pct === 100 ? (
                  <span style={{ color: 'var(--accent-teal, #2dd4bf)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={14} /> 100% Complete — All peer reviews have been submitted for this team!
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-amber, #fbbf24)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Evaluation In Progress: {activeTeamData.submittedCount} of {activeTeamData.members.length} submitted ({activeTeamData.members.length - activeTeamData.submittedCount} pending).
                  </span>
                )}
              </p>
            </div>

            {/* Quick Action Ribbon for Selected Team */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Copy Emails */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopyTeamEmails(activeTeamData.members)}
                style={{ height: '34px', fontSize: '0.78rem', gap: '0.35rem' }}
                title="Copy all team member emails to clipboard"
              >
                {copiedEmailTeam ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                {copiedEmailTeam ? 'Copied Emails!' : 'Copy Emails'}
              </button>

              {/* Mailto Team */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleEmailTeam(activeTeamData.group, activeTeamData.members)}
                style={{ height: '34px', fontSize: '0.78rem', gap: '0.35rem' }}
                title="Open email composer addressed to all team members"
              >
                <Mail size={14} className="text-teal" /> Email Team
              </button>

              {/* Export Team Excel */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleExportTeamExcel(activeTeamData)}
                style={{ height: '34px', fontSize: '0.78rem', gap: '0.35rem' }}
                title="Download Excel spreadsheet for this team only"
              >
                <Download size={14} className="text-teal" /> Excel
              </button>

              {/* Export Team CSV */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleExportTeamCSV(activeTeamData)}
                style={{ height: '34px', fontSize: '0.78rem', gap: '0.35rem' }}
                title="Download CSV for this team only"
              >
                <Download size={14} /> CSV
              </button>

              {/* Deselect / Close Inspector */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onSelectGroup('All Groups')}
                style={{ height: '34px', fontSize: '0.78rem', gap: '0.3rem', color: 'var(--accent-rose)' }}
                title="Close inspector and reset filter to all students"
              >
                <X size={14} /> Close
              </button>
            </div>
          </div>

          {/* B. Team Key Metrics Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {/* Tile 1: Deliverable Base Grade with inline editor */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Project Base Mark
                </span>
                <Award size={14} style={{ color: 'var(--accent-amber, #fbbf24)' }} />
              </div>

              {editingBaseGrade === activeTeamData.group ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={tempBaseGrade}
                    onChange={e => setTempBaseGrade(Number(e.target.value) || 0)}
                    className="form-input"
                    style={{ height: '30px', width: '70px', fontSize: '0.85rem', fontWeight: 800, padding: '0 0.4rem' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleCommitBaseGrade(activeTeamData.group, tempBaseGrade)}
                    style={{ height: '30px', padding: '0 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingBaseGrade(null)}
                    style={{ height: '30px', padding: '0 0.4rem' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {activeTeamData.teamBase}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setTempBaseGrade(activeTeamData.teamBase);
                      setEditingBaseGrade(activeTeamData.group);
                    }}
                    style={{ height: '26px', padding: '0 0.45rem', fontSize: '0.72rem', gap: '0.25rem' }}
                    title="Edit custom deliverable mark for this team"
                  >
                    <Edit2 size={11} /> Adjust
                  </button>
                </div>
              )}
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {activeClass.teamBaseGrades?.[activeTeamData.group] !== undefined ? 'Custom team base mark' : 'Inheriting default base mark'}
              </span>
            </div>

            {/* Tile 2: Submissions & Completion */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Evaluation Progress
                </span>
                <CheckCircle size={14} style={{ color: activeTeamData.pct === 100 ? 'var(--accent-teal)' : 'var(--accent-amber)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {activeTeamData.submittedCount} / {activeTeamData.members.length}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeTeamData.pct === 100 ? 'var(--accent-teal)' : 'var(--accent-amber)' }}>
                  ({activeTeamData.pct}%)
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {activeTeamData.members.length - activeTeamData.submittedCount === 0 ? 'All teammates evaluated' : `${activeTeamData.members.length - activeTeamData.submittedCount} students have not submitted`}
              </span>
            </div>

            {/* Tile 3: Intra-Team Peer Reviews */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Intra-Team Reviews
                </span>
                <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {activeTeamData.intraReviews.length}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  of {activeTeamData.members.length * Math.max(1, activeTeamData.members.length - 1)} expected
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Total ratings exchanged between teammates
              </span>
            </div>

            {/* Tile 4: Demographic & Academic Diversity */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Diversity Profile
                </span>
                <Globe size={14} style={{ color: 'var(--accent-teal)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {activeTeamData.nationalities.length}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {activeTeamData.nationalities.length === 1 ? 'Nation' : 'Nations'} · {activeTeamData.degrees.length} Majors
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeTeamData.nationalities.join(', ')}>
                {activeTeamData.nationalities.join(', ') || 'No nationality recorded'}
              </span>
            </div>
          </div>

          {/* C. Team Members Detailed Roster Cards */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--text-primary)'
                }}
              >
                <Users size={16} className="text-teal" /> Team Members &amp; Individual Performance ({activeTeamData.members.length})
              </h4>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Click Simulator or Copy Link to assist individual students
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '0.85rem'
              }}
            >
              {activeTeamData.members.map(student => {
                const initials = student.name
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                // Calculate WebPA score if active
                const { ratio, adjustedGrade } = calculateStudentWebPAScore(
                  student.id,
                  student.groupName,
                  activeClass,
                  baseGroupGrade,
                  fudgeWeight
                );

                // Reviews submitted by this student
                const reviewsGiven = (activeClass.reviews || []).filter(r => r.reviewerId === student.id);
                // Reviews received by this student
                const reviewsReceived = (activeClass.reviews || []).filter(r => r.recipientId === student.id);

                return (
                  <div
                    key={student.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md, 10px)',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Member Top Bar: Avatar, Name, Email, Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: student.submitted
                            ? 'var(--accent-teal-light, rgba(45, 212, 191, 0.15))'
                            : 'rgba(255, 255, 255, 0.08)',
                          border: `2px solid ${student.submitted ? 'var(--accent-teal, #2dd4bf)' : 'var(--border-color)'}`,
                          color: student.submitted ? 'var(--accent-teal, #2dd4bf)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 900,
                          flexShrink: 0
                        }}
                      >
                        {initials}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <strong
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {student.name}
                          </strong>

                          {/* Discreet Provenance badge if name was changed */}
                          {student.nameChangeCount && student.nameChangeCount > 0 && student.originalName && (
                            <span
                              className="badge badge-amber"
                              style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}
                              title={`Originally enrolled as: "${student.originalName}"`}
                            >
                              Edited Name
                            </span>
                          )}

                          {student.flaggedForReview && (
                            <span
                              className="badge badge-rose"
                              style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}
                              title={student.suspiciousReason || 'Flagged for instructor review'}
                            >
                              Flagged
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={student.email}
                        >
                          {student.email || 'No email provided'}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {student.submitted ? (
                          <span
                            className="badge badge-teal"
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem'
                            }}
                          >
                            <CheckCircle size={11} /> Submitted
                          </span>
                        ) : (
                          <span
                            className="badge badge-amber"
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem'
                            }}
                          >
                            <Clock size={11} /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Academic & Demographic Chips */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {student.degree && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <GraduationCap size={11} className="text-teal" /> {student.degree}
                        </span>
                      )}

                      {student.nationality && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Globe size={11} /> {normalizeNationality(student.nationality)}
                        </span>
                      )}

                      {student.studentType && student.studentType !== 'Normal' && (
                        <span
                          className="badge badge-indigo"
                          style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                        >
                          {student.studentType}
                        </span>
                      )}

                      {student.englishProficiency && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            fontWeight: 700
                          }}
                          title="CEFR English Proficiency Level"
                        >
                          CEFR: {student.englishProficiency}
                        </span>
                      )}
                    </div>

                    {/* WebPA & Review Multiplier Metrics */}
                    <div
                      style={{
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.74rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <span>
                          Given: <strong style={{ color: 'var(--text-primary)' }}>{reviewsGiven.length}</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span>
                          Received: <strong style={{ color: 'var(--text-primary)' }}>{reviewsReceived.length}</strong>
                        </span>
                      </div>

                      {reviewsReceived.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            className="badge badge-teal"
                            style={{ fontSize: '0.68rem', fontWeight: 800 }}
                            title={`WebPA Individual Factor Multiplier (${ratio.toFixed(3)})`}
                          >
                            WebPA: {ratio.toFixed(2)}x
                          </span>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                            {adjustedGrade.toFixed(1)}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Quick Student Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '0.6rem',
                        marginTop: 'auto'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {/* Simulator */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onPreviewStudent(student)}
                          style={{ height: '28px', padding: '0 0.5rem', fontSize: '0.72rem', gap: '0.25rem' }}
                          title="Simulate student evaluation portal on smartphone"
                        >
                          <Smartphone size={12} className="text-teal" /> Simulator
                        </button>

                        {/* Copy Link */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const link = getStudentLink(student);
                            navigator.clipboard.writeText(link);
                            addToast(`Copied personalized evaluation link for ${student.name}!`, 'success');
                          }}
                          style={{ height: '28px', padding: '0 0.45rem', fontSize: '0.72rem' }}
                          title="Copy student personal evaluation link"
                        >
                          <Copy size={12} />
                        </button>

                        {/* Report Card */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenReport(student.id)}
                          style={{ height: '28px', padding: '0 0.45rem', fontSize: '0.72rem' }}
                          title="View student report card"
                        >
                          <FileText size={12} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {/* Edit Student */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditStudent(student)}
                          style={{ height: '28px', padding: '0 0.45rem', fontSize: '0.72rem' }}
                          title="Edit student profile details"
                        >
                          <Edit2 size={12} />
                        </button>

                        {/* Reset Submission if already submitted */}
                        {student.submitted && onResetStudentReviews && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (triggerConfirm) {
                                triggerConfirm(
                                  'Reset Student Submission',
                                  `Are you sure you want to reset the peer review submission for "${student.name}"? This allows them to evaluate again.`,
                                  () => onResetStudentReviews(activeClass.id, student.id),
                                  'Reset Submission',
                                  'Cancel'
                                );
                              } else {
                                onResetStudentReviews(activeClass.id, student.id);
                              }
                            }}
                            style={{ height: '28px', padding: '0 0.45rem', fontSize: '0.72rem', color: 'var(--accent-amber)' }}
                            title="Reset this student's evaluation to pending"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* D. Intra-Team Peer Evaluation Matrix (Who Rated Whom) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md, 10px)',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--text-primary)'
                }}
              >
                <TrendingUp size={15} className="text-teal" /> Intra-Team Ratings &amp; Feedback Ledger
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeTeamData.intraReviews.length} evaluations recorded inside {activeTeamData.group}
              </span>
            </div>

            {activeTeamData.intraReviews.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem'
                }}
              >
                No teammates have submitted peer reviews for each other yet. Once students submit their evaluations, their scores, praise tags, and feedback will be displayed here in full detail.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.65rem', fontWeight: 700 }}>Evaluator (Reviewer)</th>
                      <th style={{ padding: '0.5rem 0.65rem', fontWeight: 700 }}>Teammate Evaluated</th>
                      <th style={{ padding: '0.5rem 0.65rem', fontWeight: 700 }}>Scores Summary</th>
                      <th style={{ padding: '0.5rem 0.65rem', fontWeight: 700 }}>Praise Tags</th>
                      <th style={{ padding: '0.5rem 0.65rem', fontWeight: 700 }}>Feedback Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTeamData.intraReviews.map((rev, idx) => {
                      const reviewer = activeTeamData.members.find(m => m.id === rev.reviewerId);
                      const recipient = activeTeamData.members.find(m => m.id === rev.recipientId);
                      const isSelf = rev.reviewerId === rev.recipientId;

                      const scoreValues = Object.values(rev.scores || {});
                      const avgScore = scoreValues.length > 0
                        ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1)
                        : '—';

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-app)'
                          }}
                        >
                          <td style={{ padding: '0.55rem 0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {reviewer?.name || 'Unknown Student'}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem', color: isSelf ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
                            {recipient?.name || 'Unknown Student'} {isSelf && '(Self Review)'}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem' }}>
                            <span
                              className="badge badge-teal"
                              style={{ fontSize: '0.72rem', fontWeight: 800 }}
                            >
                              Avg: {avgScore}
                            </span>
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem' }}>
                            {rev.praiseTags && rev.praiseTags.length > 0 ? (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                {rev.praiseTags.map((tag, tIdx) => (
                                  <span
                                    key={tIdx}
                                    style={{
                                      fontSize: '0.66rem',
                                      padding: '0.1rem 0.35rem',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--primary-light)',
                                      color: 'var(--primary)',
                                      fontWeight: 600
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: '0.55rem 0.65rem',
                              color: 'var(--text-secondary)',
                              maxWidth: '260px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={rev.strengthsText || rev.growthText || 'No comments'}
                          >
                            {rev.strengthsText || rev.growthText || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default TeamCohortsOverview;
