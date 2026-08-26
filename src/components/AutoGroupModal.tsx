import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, RefreshCw, Globe, 
  ShieldCheck, X, Shuffle, BarChart2,
  Languages, UserCheck, Layers
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  type DiversityStrategy, 
  type DiversityGroupingResult 
} from '../utils/grouping';
import CustomSelect from './CustomSelect';

interface AutoGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onApplyGroups: (updatedStudents: Student[]) => void;
}

const STRATEGY_OPTIONS = [
  { value: 'balanced_all', label: 'Balanced Multi-Dimensional (Gender + Nationality + English)' },
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

export const AutoGroupModal: React.FC<AutoGroupModalProps> = ({
  isOpen,
  onClose,
  students,
  onApplyGroups
}) => {
  const [targetSize, setTargetSize] = useState<number>(4);
  const [strategy, setStrategy] = useState<DiversityStrategy>('balanced_all');
  const [prefix, setPrefix] = useState<string>('Team');
  const [groupingResult, setGroupingResult] = useState<DiversityGroupingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Automatically compute initial balanced partition upon opening or parameter changes
  useEffect(() => {
    if (isOpen && students.length > 0) {
      runOptimization();
    }
  }, [isOpen, students, targetSize, strategy, prefix]);

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
    // Short timeout allows smooth UI animation transition
    setTimeout(() => {
      const result = generateDiverseGroups(students, {
        targetSize,
        strategy,
        prefix
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

  if (!isOpen) return null;

  const totalMembers = students.length;
  const numTeams = groupingResult ? groupingResult.groups.length : Math.ceil(totalMembers / targetSize);

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

              {/* Prefix Select */}
              <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <Layers size={15} className="text-indigo" /> Group Title Format
                </label>
                <CustomSelect
                  options={PREFIX_OPTIONS}
                  value={prefix}
                  onChange={(val) => setPrefix(val)}
                />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BarChart2 size={16} className="text-teal" /> Generated Team Rosters ({numTeams} Teams, {totalMembers} Students)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hover/review each team breakdown before applying
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                  gap: '1rem',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem'
                }}
              >
                {groupingResult?.groups.map((grp, gIdx) => (
                  <div 
                    key={gIdx}
                    style={{ 
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {grp.groupName}
                        </span>
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                          {grp.studentCount} members
                        </span>
                      </div>
                      <span 
                        className="badge badge-teal" 
                        style={{ fontSize: '0.68rem', fontWeight: 700 }}
                      >
                        {grp.diversityScore}% Diversity
                      </span>
                    </div>

                    {/* Quick Diversity Snapshot Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', fontSize: '0.72rem' }}>
                      {/* Gender count pill */}
                      <span style={{ backgroundColor: 'var(--bg-app)', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={11} className="text-primary" /> {Object.entries(grp.genderCounts).map(([g, c]) => `${c} ${g}`).join(', ')}
                      </span>
                      {/* Nationalities count pill */}
                      <span style={{ backgroundColor: 'var(--bg-app)', padding: '0.2rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Globe size={11} className="text-teal" /> {grp.uniqueNationalityCount} {grp.uniqueNationalityCount === 1 ? 'Country' : 'Countries'}
                      </span>
                    </div>

                    {/* Member List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                      {grp.students.map((s, sIdx) => (
                        <div 
                          key={sIdx}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.35rem 0.5rem',
                            backgroundColor: 'var(--bg-app)',
                            borderRadius: '6px',
                            fontSize: '0.78rem'
                          }}
                        >
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                            {s.nationality && (
                              <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.35rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                {s.nationality}
                              </span>
                            )}
                            <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.35rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>
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
    </div>,
    document.body
  );
};

export default AutoGroupModal;
