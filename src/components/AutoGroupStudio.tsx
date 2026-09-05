import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, RefreshCw, Globe, 
  ShieldCheck, Shuffle, BarChart2,
  Languages, UserCheck, Layers, ChevronDown, ChevronUp,
  LayoutGrid, Kanban, GripVertical, Download, FileSpreadsheet,
  FileText, X, GraduationCap, Building2, Plane,
  Mail, BookOpen
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  calculateGroupReport,
  type DiversityStrategy, 
  type DiversityGroupingResult,
  type GroupDiversityReport
} from '../utils/grouping';
import { exportSingleTeamToCSV, exportSingleTeamToExcel } from '../utils/csv';
import CustomSelect from './CustomSelect';
import FeatureInfoButton from './FeatureInfoButton';

interface AutoGroupStudioProps {
  students: Student[];
  onApplyGroups: (updatedStudents: Student[]) => void;
  onLoadSampleStudents?: () => void;
  defaultExpanded?: boolean;
}

const STRATEGY_OPTIONS = [
  { value: 'balanced_all', label: 'Multi-Dimensional (Gender + Nationality + University + English)' },
  { value: 'gender_first', label: 'Gender Parity First (50/50 Balance)' },
  { value: 'nationality_first', label: 'Nationality & University Mixing First' },
  { value: 'random_fast', label: 'Standard Equal Distribution' }
];

const PREFIX_OPTIONS = [
  { value: 'Team', label: 'Team (1, 2...)' },
  { value: 'Group', label: 'Group (1, 2...)' },
  { value: 'Squad', label: 'Squad (1, 2...)' },
  { value: 'Cohort', label: 'Cohort (1, 2...)' },
  { value: 'Project Group', label: 'Project Group' },
  { value: 'custom', label: 'Custom...' }
];

export const AutoGroupStudio: React.FC<AutoGroupStudioProps> = ({
  students,
  onApplyGroups,
  onLoadSampleStudents,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [targetSize, setTargetSize] = useState<number>(4);
  const [strategy, setStrategy] = useState<DiversityStrategy>('balanced_all');
  const [prefix, setPrefix] = useState<string>('Team');
  const [customPrefix, setCustomPrefix] = useState<string>('Pod');
  const [groupingResult, setGroupingResult] = useState<DiversityGroupingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Student bifurcation detail card modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Export single team modal
  const [exportModal, setExportModal] = useState<{
    isOpen: boolean;
    team: GroupDiversityReport | null;
    format: 'xlsx' | 'csv';
    scope: 'diversity_card' | 'all';
  }>({
    isOpen: false,
    team: null,
    format: 'xlsx',
    scope: 'diversity_card'
  });

  const effectivePrefix = prefix === 'custom' ? (customPrefix.trim() || 'Team') : prefix;

  // Run initial calculation
  useEffect(() => {
    if (students.length > 0) {
      runOptimization();
    }
  }, [students.length, targetSize, strategy, prefix, customPrefix]);

  const runOptimization = () => {
    if (students.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateDiverseGroups(students, {
        targetSize,
        strategy,
        prefix: effectivePrefix
      });
      setGroupingResult(result);
      setIsGenerating(false);
    }, 60);
  };

  // Move student between groups manually (Kanban Drag-and-Drop or Dropdown)
  const handleMoveStudent = (studentId: string, targetGroupName: string) => {
    if (!groupingResult) return;

    const currentStudent = groupingResult.updatedStudents.find(s => s.id === studentId);
    if (!currentStudent || currentStudent.groupName === targetGroupName) return;

    // Update students list
    const newStudents = groupingResult.updatedStudents.map(s => 
      s.id === studentId ? { ...s, groupName: targetGroupName } : s
    );

    // Group updated students
    const groupMap: Record<string, Student[]> = {};
    newStudents.forEach(s => {
      const gName = s.groupName || 'Unassigned';
      if (!groupMap[gName]) groupMap[gName] = [];
      groupMap[gName].push(s);
    });

    const newGroups: GroupDiversityReport[] = Object.entries(groupMap).map(([gName, sList]) => 
      calculateGroupReport(gName, sList)
    );

    const avgScore = newGroups.length > 0 
      ? Math.round(newGroups.reduce((acc, g) => acc + g.diversityScore, 0) / newGroups.length)
      : 0;

    setGroupingResult({
      groups: newGroups,
      updatedStudents: newStudents,
      overallDiversityScore: avgScore,
      genderBalanceRating: groupingResult.genderBalanceRating,
      nationalityMixRating: groupingResult.nationalityMixRating,
      englishMixRating: groupingResult.englishMixRating
    });
  };

  const handleApply = () => {
    if (!groupingResult) return;
    onApplyGroups(groupingResult.updatedStudents);
  };

  const handleExecuteExport = () => {
    if (!exportModal.team) return;
    if (exportModal.format === 'xlsx') {
      exportSingleTeamToExcel(exportModal.team.groupName, exportModal.team.students, exportModal.scope);
    } else {
      exportSingleTeamToCSV(exportModal.team.groupName, exportModal.team.students, exportModal.scope);
    }
    setExportModal(prev => ({ ...prev, isOpen: false }));
  };

  const totalMembers = students.length;
  const numTeams = groupingResult ? groupingResult.groups.length : Math.ceil(totalMembers / targetSize);

  // Helper to format student university text cleanly
  const renderStudentUniText = (student: Student) => {
    if (student.isExchange && student.originalUniversity && student.currentUniversity) {
      return (
        <span 
          style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
          title={`Exchange Student: ${student.originalUniversity} (${student.originalCountry || 'Home'}) ➔ ${student.currentUniversity} (${student.currentCountry || 'Host'})`}
        >
          <Plane size={11} className="text-teal" style={{ flexShrink: 0 }} />
          <span>{student.originalUniversity} ➔ {student.currentUniversity}</span>
        </span>
      );
    }
    const uni = student.university || student.currentUniversity || student.originalUniversity;
    if (uni) {
      return (
        <span 
          style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
          title={uni}
        >
          <GraduationCap size={11} style={{ flexShrink: 0, opacity: 0.75 }} />
          <span>{uni}</span>
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        University Unassigned
      </span>
    );
  };

  return (
    <div 
      className="card" 
      style={{ 
        borderLeft: '4px solid var(--accent-teal)', 
        backgroundColor: 'var(--bg-surface)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 200ms ease'
      }}
    >
      {/* Studio Header Bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.75rem',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              backgroundColor: 'rgba(20, 184, 166, 0.12)', 
              color: 'var(--accent-teal)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                Intelligent Auto-Group &amp; Diversity Studio
              </h3>
              <FeatureInfoButton featureId="auto-group-studio" size="sm" tooltipText="Learn about Auto-Group Studio" />
              {groupingResult && (
                <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  {groupingResult.overallDiversityScore}% Diversity Score
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
              Mathematical multi-criteria balancing: gender parity (50/50 ratio), cross-cultural nationality dispersion, and English skill spread.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} /> Collapse Studio
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Open Studio ({numTeams} Teams)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Workbench Deck */}
      {isExpanded && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          
          {/* Unified Controls & Diversity Health Deck */}
          <div 
            style={{
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* 1. Top Controls & Strategy Bar */}
            <div 
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'flex-end',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Target Size with Quick Stepper */}
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                  <Users size={13} className="text-teal" /> Team Size
                </label>
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', height: '36px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setTargetSize(prev => Math.max(2, prev - 1))}
                    disabled={targetSize <= 2}
                    style={{ width: '28px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: targetSize <= 2 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', borderRadius: '4px' }}
                    title="Decrease team size"
                  >
                    -
                  </button>
                  <span style={{ minWidth: '38px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {targetSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetSize(prev => Math.min(Math.max(2, totalMembers), prev + 1))}
                    disabled={targetSize >= Math.max(2, totalMembers)}
                    style={{ width: '28px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1rem', borderRadius: '4px' }}
                    title="Increase team size"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Diversity Strategy */}
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 180px', minWidth: '140px', maxWidth: '100%' }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                  <Sparkles size={13} className="text-primary" /> Diversity Strategy
                </label>
                <CustomSelect
                  options={STRATEGY_OPTIONS}
                  value={strategy}
                  onChange={(val) => setStrategy(val as DiversityStrategy)}
                  style={{ width: '100%' }}
                  triggerStyle={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.65rem', width: '100%' }}
                />
              </div>

              {/* Group Naming Prefix + Custom Option */}
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 160px', minWidth: '130px', maxWidth: '100%' }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                  <Layers size={13} className="text-teal" /> Naming Style
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', width: '100%' }}>
                  <CustomSelect
                    options={PREFIX_OPTIONS}
                    value={prefix}
                    onChange={(val) => setPrefix(val)}
                    triggerStyle={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    style={{ flex: prefix === 'custom' ? '0 0 110px' : '1', minWidth: 0 }}
                  />
                  {prefix === 'custom' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Pod..."
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      style={{ height: '36px', fontSize: '0.8rem', fontWeight: 600, flex: 1, minWidth: '60px', padding: '0.35rem 0.6rem' }}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-group" style={{ margin: 0, display: 'flex', gap: '0.4rem', height: '36px', flexShrink: 0, marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={runOptimization}
                  style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  title="Re-calculate a new optimal permutation"
                >
                  <Shuffle size={13} /> Re-Shuffle
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleApply}
                  disabled={totalMembers === 0 || isGenerating}
                  style={{ height: '36px', padding: '0 0.9rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                >
                  <Check size={14} /> Assign Teams
                </button>
              </div>
            </div>

            {/* 2. Integrated Diversity Health Strip */}
            {groupingResult && (
              <div 
                style={{
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '0.55rem 1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}
              >
                {/* Overall Index */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    style={{ 
                      minWidth: '46px',
                      padding: '0 0.35rem', 
                      height: '30px', 
                      borderRadius: '6px', 
                      backgroundColor: 'rgba(20, 184, 166, 0.14)', 
                      color: 'var(--accent-teal)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}
                  >
                    {groupingResult.overallDiversityScore}%
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Team Balance Index</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                      {groupingResult.overallDiversityScore >= 80 ? 'Highly Balanced' : 'Evenly Distributed'}
                    </div>
                  </div>
                </div>

                {/* Gender Balance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={15} />
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Gender Balance</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {groupingResult.genderBalanceRating} Distribution
                    </div>
                  </div>
                </div>

                {/* Nationality & Origin Diversity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={15} />
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Origin Diversity</div>
                    <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                      {groupingResult.nationalityMixRating}
                    </div>
                  </div>
                </div>

                {/* Language Proficiency Spread */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Languages size={15} />
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-primary)' }}>Language Distribution</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      {groupingResult.englishMixRating}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Switcher Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <BarChart2 size={16} className="text-teal" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Generated Team Rosters ({numTeams} Teams, {totalMembers} Students)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                • Click any student name for detailed info
              </span>
            </div>

            {/* Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', border: 'none' }}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={13} /> Grid View
              </button>

              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', border: 'none' }}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={13} /> Drag &amp; Drop Kanban
              </button>
            </div>
          </div>

          {/* Generated Teams Preview */}
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={22} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
              Simulating optimal multi-criteria permutations...
            </div>
          ) : totalMembers === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <span>No students enrolled in this classroom yet. Add students using the wizard or load sample data to test team balancing.</span>
              {onLoadSampleStudents && (
                <button
                  type="button"
                  className="btn btn-teal btn-sm"
                  onClick={onLoadSampleStudents}
                  style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Sparkles size={13} /> Load 100 Sample Students into Classroom
                </button>
              )}
            </div>
          ) : viewMode === 'kanban' ? (
            /* --- KANBAN DRAG AND DROP REBALANCING BOARD --- */
            <div 
              style={{ 
                display: 'flex', 
                gap: '1rem', 
                overflowX: 'auto', 
                paddingBottom: '0.75rem',
                minHeight: '390px'
              }}
            >
              {groupingResult?.groups.map((grp) => (
                <div
                  key={grp.groupName}
                  style={{
                    flex: '0 0 310px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    maxHeight: '480px'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    if (draggedStudentId) {
                      handleMoveStudent(draggedStudentId, grp.groupName);
                      setDraggedStudentId(null);
                    }
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                      <b style={{ fontSize: '0.94rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grp.groupName}</b>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', flexShrink: 0 }}>
                        {grp.studentCount}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        {grp.diversityScore}%
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExportModal({ isOpen: true, team: grp, format: 'xlsx', scope: 'diversity_card' })}
                        title={`Export ${grp.groupName} roster`}
                        style={{ padding: '0.2rem 0.45rem', height: '24px', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem' }}
                      >
                        <Download size={11} /> Export
                      </button>
                    </div>
                  </div>

                  {/* Clean Demographic Ribbon */}
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '0.3rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.3rem 0.45rem',
                      fontSize: '0.69rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap' }} title={Object.entries(grp.genderCounts).map(([g, c]) => `${c} ${g}`).join(', ')}>
                      <Users size={11} className="text-primary" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {Object.entries(grp.genderCounts).map(([g, c]) => `${c}${g[0]}`).join('/')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: 'center' }} title={`${grp.uniqueUniversityCount || grp.studentCount} Universities, ${grp.uniqueNationalityCount} Nationalities`}>
                      <Globe size={11} className="text-teal" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {grp.uniqueNationalityCount} {grp.uniqueNationalityCount === 1 ? 'nat' : 'nats'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: 'flex-end' }} title={`Avg English: ${grp.avgEnglishCEFR || 'C1'}`}>
                      <Languages size={11} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>
                        {grp.avgEnglishCEFR?.split(' ')[0] || 'C1'}
                      </span>
                    </div>
                  </div>

                  {/* Student Cards in Column */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingRight: '0.2rem' }}>
                    {grp.students.map((student) => {
                      const isF = student.gender?.toLowerCase() === 'female';
                      const isM = student.gender?.toLowerCase() === 'male';
                      const gBg = isF ? 'rgba(236, 72, 153, 0.12)' : isM ? 'rgba(99, 102, 241, 0.12)' : 'rgba(168, 85, 247, 0.12)';
                      const gColor = isF ? '#ec4899' : isM ? 'var(--primary)' : '#a855f7';

                      return (
                        <div
                          key={student.id}
                          draggable
                          onDragStart={() => setDraggedStudentId(student.id)}
                          onDragEnd={() => setDraggedStudentId(null)}
                          onClick={() => setSelectedStudent(student)}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.55rem 0.65rem',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Click to view student bifurcation card"
                        >
                          {/* Student Name & Gender */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', minWidth: 0 }}>
                              <GripVertical size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} />
                              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {student.name}
                              </span>
                            </div>

                            <span style={{ 
                              fontSize: '0.67rem', 
                              padding: '0.12rem 0.4rem', 
                              backgroundColor: gBg, 
                              color: gColor, 
                              borderRadius: '4px', 
                              fontWeight: 700,
                              flexShrink: 0
                            }}>
                              {student.gender || 'Female'}
                            </span>
                          </div>

                          {/* University Subtitle below name */}
                          <div style={{ paddingLeft: '1rem', overflow: 'hidden' }}>
                            {renderStudentUniText(student)}
                          </div>

                          {/* Bottom row: Nationality & Quick move selector */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem', marginTop: '0.15rem' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Globe size={10} className="text-teal" /> {student.nationality || 'Unspecified'}
                            </span>
                            
                            {/* Compact Quick Move Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }} onClick={(e) => e.stopPropagation()}>
                              <select
                                value={grp.groupName}
                                onChange={(e) => handleMoveStudent(student.id, e.target.value)}
                                style={{ 
                                  fontSize: '0.66rem', 
                                  padding: '0.12rem 0.3rem', 
                                  borderRadius: '4px', 
                                  border: '1px solid var(--border-color)', 
                                  backgroundColor: 'var(--bg-app)', 
                                  color: 'var(--text-primary)',
                                  fontWeight: 600,
                                  maxWidth: '90px',
                                  cursor: 'pointer'
                                }}
                                title="Transfer student to another team"
                              >
                                {groupingResult?.groups.map(targetG => (
                                  <option key={targetG.groupName} value={targetG.groupName}>
                                    {targetG.groupName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* --- GRID OVERVIEW MODE --- */
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', 
                gap: '1rem', 
                maxHeight: '400px', 
                overflowY: 'auto', 
                paddingRight: '0.35rem' 
              }}
            >
              {groupingResult?.groups.map((grp, gIdx) => (
                <div 
                  key={gIdx}
                  style={{ 
                    backgroundColor: 'var(--bg-app)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '10px', 
                    padding: '0.95rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.65rem', 
                    boxShadow: 'var(--shadow-sm)' 
                  }}
                >
                  {/* Clean Single-Line Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {grp.groupName}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.12rem 0.45rem', flexShrink: 0, fontWeight: 600 }}>
                        {grp.studentCount} {grp.studentCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem' }}>
                        {grp.diversityScore}% Diverse
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExportModal({ isOpen: true, team: grp, format: 'xlsx', scope: 'diversity_card' })}
                        title={`Export ${grp.groupName} roster`}
                        style={{ padding: '0.2rem 0.5rem', height: '25px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600 }}
                      >
                        <Download size={11} /> Export
                      </button>
                    </div>
                  </div>

                  {/* Clean 3-Item Metric Ribbon */}
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '0.35rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.72rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap' }} title={Object.entries(grp.genderCounts).map(([g, c]) => `${c} ${g}`).join(', ')}>
                      <Users size={12} className="text-primary" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {Object.entries(grp.genderCounts).map(([g, c]) => `${c} ${g === 'Female' ? 'F' : g === 'Male' ? 'M' : 'NB'}`).join(' • ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: 'center' }} title={`${grp.uniqueUniversityCount || grp.studentCount} Universities • ${grp.uniqueNationalityCount} Nationalities`}>
                      <Globe size={12} className="text-teal" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {grp.uniqueNationalityCount} {grp.uniqueNationalityCount === 1 ? 'Nationality' : 'Nationalities'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: 'flex-end' }} title={`Avg English CEFR Level: ${grp.avgEnglishCEFR || 'C1 (Fluent)'}`}>
                      <Languages size={12} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>
                        Avg: {grp.avgEnglishCEFR?.split(' ')[0] || 'C1'}
                      </span>
                    </div>
                  </div>

                  {/* Clean Student Roster Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {grp.students.map((s, sIdx) => {
                      const isF = s.gender?.toLowerCase() === 'female';
                      const isM = s.gender?.toLowerCase() === 'male';
                      const gBg = isF ? 'rgba(236, 72, 153, 0.12)' : isM ? 'rgba(99, 102, 241, 0.12)' : 'rgba(168, 85, 247, 0.12)';
                      const gColor = isF ? '#ec4899' : isM ? 'var(--primary)' : '#a855f7';

                      return (
                        <div 
                          key={sIdx}
                          onClick={() => setSelectedStudent(s)}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.5rem 0.65rem',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 120ms ease',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Click to view full bifurcation card profile"
                        >
                          {/* Left: Name + University subtitle */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden', minWidth: 0, flex: 1 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.84rem' }}>
                              {s.name}
                            </span>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {renderStudentUniText(s)}
                            </div>
                          </div>

                          {/* Right: Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            {s.nationality && (
                              <span 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  padding: '0.15rem 0.45rem', 
                                  backgroundColor: 'var(--bg-app)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: '4px', 
                                  color: 'var(--text-secondary)',
                                  fontWeight: 500,
                                  maxWidth: '90px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={s.nationality}
                              >
                                {s.nationality}
                              </span>
                            )}
                            <span 
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.15rem 0.45rem', 
                                backgroundColor: gBg, 
                                color: gColor, 
                                borderRadius: '4px', 
                                fontWeight: 700 
                              }}
                            >
                              {s.gender || 'Female'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} className="text-teal" />
            <span>Simulated annealing multi-objective optimization with live drag-and-drop rebalancing.</span>
          </div>
        </div>
      )}

      {/* --- STUDENT BIFURCATION INFORMATION CARD MODAL --- */}
      {selectedStudent && createPortal(
        <div className="modal-overlay" style={{ animation: 'fadeIn 150ms ease', zIndex: 1100 }} onClick={() => setSelectedStudent(null)}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '520px', 
              width: '94%', 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-premium)', 
              padding: 0, 
              overflow: 'hidden',
              zIndex: 1101
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Banner */}
            <div 
              style={{ 
                padding: '1.25rem 1.35rem', 
                background: 'linear-gradient(135deg, var(--bg-surface), var(--primary-light))', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    backgroundColor: 'var(--primary)', 
                    color: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 800, 
                    fontSize: '1.15rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedStudent.name}
                    </h3>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      {selectedStudent.groupName || 'Unassigned'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Student ID: {selectedStudent.id}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Bifurcation Attributes */}
            <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Email & Degree */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                    <Mail size={12} className="text-primary" /> Institutional Email
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {selectedStudent.email || 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                    <BookOpen size={12} className="text-teal" /> Degree / Major
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedStudent.degree || 'General Degree'}
                  </div>
                </div>
              </div>

              {/* Gender & English CEFR Level */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                    <UserCheck size={12} className="text-indigo" /> Gender Demographics
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedStudent.gender || 'Prefer not to say'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                    <Languages size={12} className="text-amber" /> English Proficiency
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedStudent.englishProficiency || 'Fluent (C1/C2)'}
                  </div>
                </div>
              </div>

              {/* Geographic & International Status */}
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase' }}>
                    <Globe size={13} className="text-teal" /> Geographic &amp; Student Status
                  </div>
                  {selectedStudent.isExchange ? (
                    <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                      <Plane size={11} /> Exchange / Erasmus
                    </span>
                  ) : (
                    <span className="badge badge-secondary" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                      {selectedStudent.studentType || 'Regular Student'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Nationality / Origin</span>
                    <b style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {selectedStudent.nationality || 'Unspecified'}
                    </b>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Current Country (Host/Resident)</span>
                    <b style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {selectedStudent.currentCountry || selectedStudent.nationality || 'Unspecified'}
                    </b>
                  </div>
                </div>
              </div>

              {/* University & Exchange Institution Card */}
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                  <GraduationCap size={14} className="text-indigo" /> Academic Institution
                </div>

                {selectedStudent.isExchange ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <Building2 size={13} className="text-primary" />
                      <span style={{ color: 'var(--text-muted)' }}>Home University:</span>
                      <b style={{ color: 'var(--text-primary)' }}>{selectedStudent.originalUniversity || selectedStudent.university || 'N/A'}</b>
                      {selectedStudent.originalCountry && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.66rem' }}>({selectedStudent.originalCountry})</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <GraduationCap size={13} className="text-teal" />
                      <span style={{ color: 'var(--text-muted)' }}>Host University:</span>
                      <b style={{ color: 'var(--text-primary)' }}>{selectedStudent.currentUniversity || selectedStudent.university || 'N/A'}</b>
                      {selectedStudent.currentCountry && (
                        <span className="badge badge-teal" style={{ fontSize: '0.66rem' }}>({selectedStudent.currentCountry})</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>University / College</span>
                    <b style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {selectedStudent.university || selectedStudent.currentUniversity || 'University Unspecified'}
                    </b>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.85rem 1.35rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedStudent(null)}
                style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- EXPORT INDIVIDUAL TEAM MODAL --- */}
      {exportModal.isOpen && exportModal.team && createPortal(
        <div className="modal-overlay" style={{ animation: 'fadeIn 150ms ease', zIndex: 1100 }} onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '480px', 
              width: '94%', 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-lg)', 
              boxShadow: 'var(--shadow-premium)', 
              padding: 0, 
              overflow: 'hidden',
              zIndex: 1101
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              style={{ 
                padding: '1.15rem 1.35rem', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Export {exportModal.team.groupName} Roster
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {exportModal.team.studentCount} members assigned to this team
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Export Format Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'block' }}>
                  1. Choose Export Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      padding: '0.75rem 0.85rem', 
                      borderRadius: '8px', 
                      border: `2px solid ${exportModal.format === 'xlsx' ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                      backgroundColor: exportModal.format === 'xlsx' ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="xlsx" 
                      checked={exportModal.format === 'xlsx'}
                      onChange={() => setExportModal(prev => ({ ...prev, format: 'xlsx' }))}
                      style={{ accentColor: 'var(--accent-teal)' }}
                    />
                    <div>
                      <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FileSpreadsheet size={14} className="text-teal" /> Excel Workbook
                      </b>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>.xlsx format</span>
                    </div>
                  </label>

                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      padding: '0.75rem 0.85rem', 
                      borderRadius: '8px', 
                      border: `2px solid ${exportModal.format === 'csv' ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: exportModal.format === 'csv' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="csv" 
                      checked={exportModal.format === 'csv'}
                      onChange={() => setExportModal(prev => ({ ...prev, format: 'csv' }))}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FileText size={14} className="text-primary" /> CSV Document
                      </b>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>.csv format</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Scope Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'block' }}>
                  2. Choose Data Content to Include
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.65rem', 
                      padding: '0.75rem 0.85rem', 
                      borderRadius: '8px', 
                      border: `2px solid ${exportModal.scope === 'diversity_card' ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                      backgroundColor: exportModal.scope === 'diversity_card' ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="exportScope" 
                      value="diversity_card" 
                      checked={exportModal.scope === 'diversity_card'}
                      onChange={() => setExportModal(prev => ({ ...prev, scope: 'diversity_card' }))}
                      style={{ marginTop: '2px', accentColor: 'var(--accent-teal)' }}
                    />
                    <div>
                      <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        Diversity Studio Card Info Only
                      </b>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                        Includes Name, Team, Gender, English CEFR level, Nationality, Current Country, Original/Current Universities, Degree, and Exchange status.
                      </span>
                    </div>
                  </label>

                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.65rem', 
                      padding: '0.75rem 0.85rem', 
                      borderRadius: '8px', 
                      border: `2px solid ${exportModal.scope === 'all' ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: exportModal.scope === 'all' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="exportScope" 
                      value="all" 
                      checked={exportModal.scope === 'all'}
                      onChange={() => setExportModal(prev => ({ ...prev, scope: 'all' }))}
                      style={{ marginTop: '2px', accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                        All Data About These Students
                      </b>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                        Includes all student attributes plus submission status, peer reviews count, expected reviews, and grade metrics.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleExecuteExport}
                style={{ fontSize: '0.85rem', padding: '0.4rem 1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={14} /> Download Roster
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AutoGroupStudio;
