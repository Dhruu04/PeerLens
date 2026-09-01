import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, RefreshCw, Globe, 
  ShieldCheck, X, Shuffle, BarChart2,
  Languages, UserCheck, Layers, Download, FileSpreadsheet,
  FileText, GraduationCap, Building2, Plane,
  Mail, BookOpen
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  type DiversityStrategy, 
  type DiversityGroupingResult,
  type GroupDiversityReport
} from '../utils/grouping';
import { exportSingleTeamToCSV, exportSingleTeamToExcel } from '../utils/csv';
import CustomSelect from './CustomSelect';

interface AutoGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onApplyGroups: (updatedStudents: Student[]) => void;
}

const STRATEGY_OPTIONS = [
  { value: 'balanced_all', label: 'Balanced Multi-Dimensional (Gender + Nationality + University + English)' },
  { value: 'gender_first', label: 'Gender Parity First (50/50 Male-Female Priority)' },
  { value: 'nationality_first', label: 'Nationality & University Mixing First' },
  { value: 'random_fast', label: 'Equal-Size Standard Distribution' }
];

const PREFIX_OPTIONS = [
  { value: 'Team', label: 'Team (e.g. Team 1, Team 2)' },
  { value: 'Group', label: 'Group (e.g. Group 1, Group 2)' },
  { value: 'Squad', label: 'Squad (e.g. Squad 1, Squad 2)' },
  { value: 'Cohort', label: 'Cohort (e.g. Cohort 1, Cohort 2)' },
  { value: 'Project Group', label: 'Project Group (e.g. Project Group 1)' },
  { value: 'custom', label: 'Custom Name (Enter your own...)' }
];

export const AutoGroupModal: React.FC<AutoGroupModalProps> = ({
  isOpen,
  onClose,
  students,
  onApplyGroups
}) => {
  const [targetSize, setTargetSize] = useState<number>(4);
  const [strategy, setStrategy] = useState<DiversityStrategy>('balanced_all');
  const [prefix, setPrefix] = useState<string>('Team');
  const [customPrefix, setCustomPrefix] = useState<string>('Pod');
  const [groupingResult, setGroupingResult] = useState<DiversityGroupingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

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

  // Automatically compute initial balanced partition upon opening or parameter changes
  useEffect(() => {
    if (isOpen && students.length > 0) {
      runOptimization();
    }
  }, [isOpen, students, targetSize, strategy, prefix, customPrefix]);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    }
  }, [isOpen]);

  const runOptimization = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateDiverseGroups(students, {
        targetSize,
        strategy,
        prefix: effectivePrefix
      });
      setGroupingResult(result);
      setIsGenerating(false);
    }, 80);
  };

  const handleApply = () => {
    if (!groupingResult) return;
    onApplyGroups(groupingResult.updatedStudents);
    onClose();
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

  if (!isOpen) return null;

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

  return createPortal(
    <div className="modal-overlay" style={{ animation: 'fadeIn 180ms ease' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1000px', 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{ 
            padding: '1.25rem 1.5rem', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(20, 184, 166, 0.12)', 
                color: 'var(--accent-teal)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Intelligent Auto-Group Diversity Studio
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Algorithmic team balancing with gender parity, cross-cultural nationality mixing, and balanced English levels.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer', 
              padding: '0.5rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Configuration Controls Deck */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem', 
              backgroundColor: 'var(--bg-app)', 
              padding: '1.25rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)' 
            }}
          >
            {/* 3 Spacious Columns */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                gap: '1.25rem', 
                alignItems: 'flex-start' 
              }}
            >
              {/* Target Size */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <Users size={15} className="text-teal" /> Target Team Size
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    min={2} 
                    max={Math.max(2, totalMembers)}
                    value={targetSize}
                    onChange={(e) => setTargetSize(Math.max(2, Number(e.target.value)))}
                    style={{ fontWeight: 700, textAlign: 'center', minHeight: '42px', width: '90px' }}
                  />
                  <span className="badge badge-secondary" style={{ fontSize: '0.76rem', padding: '0.4rem 0.65rem' }}>
                    {numTeams} {numTeams === 1 ? 'Team' : 'Teams'} will be created
                  </span>
                </div>
              </div>

              {/* Strategy Select */}
              <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <Sparkles size={15} className="text-primary" /> Diversity Optimization Model
                </label>
                <CustomSelect
                  options={STRATEGY_OPTIONS}
                  value={strategy}
                  onChange={(val) => setStrategy(val as DiversityStrategy)}
                />
              </div>

              {/* Prefix Select + Custom Option */}
              <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <Layers size={15} className="text-indigo" /> Group Title Format
                </label>
                <CustomSelect
                  options={PREFIX_OPTIONS}
                  value={prefix}
                  onChange={(val) => setPrefix(val)}
                />
                {prefix === 'custom' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Pod, Studio, Alpha, Room..."
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    style={{ height: '36px', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.35rem' }}
                  />
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {totalMembers} students registered • Partitioned into {numTeams} teams
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={runOptimization}
                style={{ minHeight: '38px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Shuffle size={14} /> Re-Calculate Permutation
              </button>
            </div>
          </div>

          {/* Diversity Score & Metrics Ribbon */}
          {groupingResult && (
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '0.75rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem'
              }}
            >
              {/* Overall Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(20, 184, 166, 0.15)', 
                    color: 'var(--accent-teal)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}
                >
                  {groupingResult.overallDiversityScore}%
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Diversity Index</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                    {groupingResult.overallDiversityScore >= 80 ? 'Highly Balanced' : 'Well Distributed'}
                  </div>
                </div>
              </div>

              {/* Gender Balance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Gender Parity</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {groupingResult.genderBalanceRating} Ratio
                  </div>
                </div>
              </div>

              {/* Nationality Mixing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Nationality Mix</div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                    {groupingResult.nationalityMixRating}
                  </div>
                </div>
              </div>

              {/* English Level Balance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Languages size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>English Distribution</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                    {groupingResult.englishMixRating}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Groups Grid Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <BarChart2 size={16} className="text-teal" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Generated Team Rosters ({numTeams} Teams, {totalMembers} Students)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Click any student name to inspect their bifurcation card
              </span>
            </div>

            {isGenerating ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
                Optimizing multi-criteria diversity permutations...
              </div>
            ) : (
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', 
                  gap: '1rem',
                  maxHeight: '440px',
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
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div 
          style={{ 
            padding: '1rem 1.5rem', 
            borderTop: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} className="text-teal" />
            <span>Mathematical round-robin optimization with simulated diversity annealing.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              style={{ fontWeight: 700, gap: '0.4rem' }}
            >
              <Check size={16} /> Apply Balanced Teams to Classroom
            </button>
          </div>
        </div>
      </div>

      {/* --- STUDENT BIFURCATION INFORMATION CARD MODAL --- */}
      {selectedStudent && (
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
        </div>
      )}

      {/* --- EXPORT INDIVIDUAL TEAM MODAL --- */}
      {exportModal.isOpen && exportModal.team && (
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
                      name="modalExportFormat" 
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
                      name="modalExportFormat" 
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
                      name="modalExportScope" 
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
                      name="modalExportScope" 
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
        </div>
      )}

    </div>,
    document.body
  );
};

export default AutoGroupModal;
