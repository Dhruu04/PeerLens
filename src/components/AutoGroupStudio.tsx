import React, { useState, useEffect } from 'react';
import { 
  Users, Sparkles, Check, RefreshCw, Globe, 
  ShieldCheck, Shuffle, BarChart2,
  Languages, UserCheck, Layers, ChevronDown, ChevronUp,
  LayoutGrid, Kanban, GripVertical
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  calculateGroupReport,
  type DiversityStrategy, 
  type DiversityGroupingResult,
  type GroupDiversityReport
} from '../utils/grouping';
import CustomSelect from './CustomSelect';

interface AutoGroupStudioProps {
  students: Student[];
  onApplyGroups: (updatedStudents: Student[]) => void;
  onLoadSampleStudents?: () => void;
  defaultExpanded?: boolean;
}

const STRATEGY_OPTIONS = [
  { value: 'balanced_all', label: 'Multi-Dimensional (Gender + Nationality + English)' },
  { value: 'gender_first', label: 'Gender Parity First (50/50 Male-Female Priority)' },
  { value: 'nationality_first', label: 'Nationality Mixing First (Cross-Cultural Focus)' },
  { value: 'random_fast', label: 'Equal-Size Standard Distribution' }
];

const PREFIX_OPTIONS = [
  { value: 'Team', label: 'Team (e.g. Team 1, Team 2)' },
  { value: 'Group', label: 'Group (e.g. Group 1, Group 2)' },
  { value: 'Squad', label: 'Squad (e.g. Squad 1, Squad 2)' },
  { value: 'Cohort', label: 'Cohort (e.g. Cohort 1, Cohort 2)' },
  { value: 'Project Group', label: 'Project Group (e.g. Project Group 1)' }
];

export const AutoGroupStudio: React.FC<AutoGroupStudioProps> = ({
  students,
  onApplyGroups,
  onLoadSampleStudents,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [targetSize, setTargetSize] = useState<number>(4);
  const [strategy, setStrategy] = useState<DiversityStrategy>('balanced_all');
  const [prefix, setPrefix] = useState<string>('Team');
  const [groupingResult, setGroupingResult] = useState<DiversityGroupingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Run initial calculation
  useEffect(() => {
    if (students.length > 0) {
      runOptimization();
    }
  }, [students.length, targetSize, strategy, prefix]);

  const runOptimization = () => {
    if (students.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateDiverseGroups(students, {
        targetSize,
        strategy,
        prefix
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

  const totalMembers = students.length;
  const numTeams = groupingResult ? groupingResult.groups.length : Math.ceil(totalMembers / targetSize);

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
          
          {/* Controls Deck */}
          <div className="studio-controls-deck">
            {/* Target Size */}
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={14} className="text-teal" /> Target Team Size
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                <input 
                  type="number"
                  className="form-input"
                  min={2}
                  max={Math.max(2, totalMembers)}
                  value={targetSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1) setTargetSize(val);
                  }}
                  style={{ height: '38px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', width: '80px', padding: '0.35rem 0.5rem' }}
                />
                <span className="badge badge-teal" style={{ minWidth: '70px', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, height: '38px', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center' }}>
                  {targetSize} / team
                </span>
              </div>
            </div>

            {/* Optimization Strategy */}
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} className="text-primary" /> Diversity Strategy
              </label>
              <CustomSelect
                options={STRATEGY_OPTIONS}
                value={strategy}
                onChange={(val) => setStrategy(val as DiversityStrategy)}
                triggerStyle={{ height: '38px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Group Naming Prefix */}
            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={14} className="text-teal" /> Naming Style
              </label>
              <CustomSelect
                options={PREFIX_OPTIONS}
                value={prefix}
                onChange={(val) => setPrefix(val)}
                triggerStyle={{ height: '38px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Action Buttons */}
            <div className="form-group studio-actions-col" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="studio-actions-label" style={{ fontSize: '0.8rem', fontWeight: 700, height: '18px' }}>Actions</span>
              <div style={{ display: 'flex', gap: '0.4rem', height: '38px', alignItems: 'center', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={runOptimization}
                  style={{ flex: 1, height: '38px', padding: '0 0.65rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  title="Re-calculate a new optimal permutation"
                >
                  <Shuffle size={13} /> Re-Shuffle
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApply}
                  disabled={totalMembers === 0 || isGenerating}
                  style={{ flex: 1.2, height: '38px', padding: '0 0.85rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap' }}
                >
                  <Check size={14} /> Apply Teams
                </button>
              </div>
            </div>
          </div>

          {/* Diversity Score Ribbon */}
          {groupingResult && (
            <div className="diversity-score-ribbon">
              {/* Overall Index */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    backgroundColor: 'rgba(20, 184, 166, 0.15)', 
                    color: 'var(--accent-teal)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}
                >
                  {groupingResult.overallDiversityScore}%
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Diversity Index</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                    {groupingResult.overallDiversityScore >= 80 ? 'Highly Balanced' : 'Well Distributed'}
                  </div>
                </div>
              </div>

              {/* Gender Parity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Gender Parity</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {groupingResult.genderBalanceRating} Ratio
                  </div>
                </div>
              </div>

              {/* Nationality Mixing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Cross-Cultural Mix</div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                    {groupingResult.nationalityMixRating}
                  </div>
                </div>
              </div>

              {/* English Spread */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Languages size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>English Spread</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                    {groupingResult.englishMixRating}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Mode Switcher Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BarChart2 size={15} className="text-teal" /> Generated Team Rosters ({numTeams} Teams, {totalMembers} Students)
            </span>

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
                minHeight: '380px'
              }}
            >
              {groupingResult?.groups.map((grp) => (
                <div
                  key={grp.groupName}
                  style={{
                    flex: '0 0 280px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    maxHeight: '440px'
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div>
                      <b style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{grp.groupName}</b>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                        ({grp.studentCount} students)
                      </span>
                    </div>
                    <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                      {grp.diversityScore}%
                    </span>
                  </div>

                  {/* Demographic Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.68rem' }}>
                    <span className="badge badge-secondary">
                      {Object.entries(grp.genderCounts).map(([g, c]) => `${c}${g[0]}`).join('/')}
                    </span>
                    <span className="badge badge-secondary">
                      {grp.uniqueNationalityCount} countries
                    </span>
                  </div>

                  {/* Student Cards in Column */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingRight: '0.2rem' }}>
                    {grp.students.map((student) => (
                      <div
                        key={student.id}
                        draggable
                        onDragStart={() => setDraggedStudentId(student.id)}
                        onDragEnd={() => setDraggedStudentId(null)}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.55rem 0.65rem',
                          cursor: 'grab',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                            <GripVertical size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {student.name}
                            </span>
                          </div>

                          <span style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.4rem', 
                            backgroundColor: student.gender?.toLowerCase() === 'female' ? 'var(--accent-rose-light)' : 'var(--primary-light)', 
                            color: student.gender?.toLowerCase() === 'female' ? 'var(--accent-rose)' : 'var(--primary)', 
                            borderRadius: '10px', 
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {student.gender ? (student.gender.toLowerCase() === 'female' ? 'F' : 'M') : 'F'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '95px' }}>
                            {student.nationality || 'Unspecified'}
                          </span>
                          
                          {/* Compact Quick Move Selector */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <select
                              value={grp.groupName}
                              onChange={(e) => handleMoveStudent(student.id, e.target.value)}
                              style={{ 
                                fontSize: '0.68rem', 
                                padding: '0.15rem 0.35rem', 
                                borderRadius: '4px', 
                                border: '1px solid var(--border-color)', 
                                backgroundColor: 'var(--bg-app)', 
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                                maxWidth: '85px',
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* --- GRID OVERVIEW MODE --- */
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                gap: '0.85rem',
                maxHeight: '340px',
                overflowY: 'auto',
                paddingRight: '0.25rem'
              }}
            >
              {groupingResult?.groups.map((grp, gIdx) => (
                <div 
                  key={gIdx}
                  style={{ 
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {grp.groupName}
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                        {grp.studentCount}
                      </span>
                    </div>
                    <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                      {grp.diversityScore}% Diverse
                    </span>
                  </div>

                  {/* Snapshot */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', fontSize: '0.7rem' }}>
                    <span style={{ backgroundColor: 'var(--bg-surface)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={10} className="text-primary" /> {Object.entries(grp.genderCounts).map(([g, c]) => `${c} ${g}`).join(', ')}
                    </span>
                    <span style={{ backgroundColor: 'var(--bg-surface)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Globe size={10} className="text-teal" /> {grp.uniqueNationalityCount} {grp.uniqueNationalityCount === 1 ? 'Country' : 'Countries'}
                    </span>
                  </div>

                  {/* Members */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {grp.students.map((s, sIdx) => (
                      <div 
                        key={sIdx}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.25rem 0.45rem',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.75rem'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
                          {s.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                          {s.nationality && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                              {s.nationality}
                            </span>
                          )}
                          <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '3px', fontWeight: 600 }}>
                            {s.gender || 'Female'}
                          </span>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
};

export default AutoGroupStudio;
