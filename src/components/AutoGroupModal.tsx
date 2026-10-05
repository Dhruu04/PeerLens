import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, RefreshCw, Globe, 
  X, Shuffle,
  Languages, UserCheck, Layers, Download,
  GraduationCap, Plane,
  Sliders, Plus, Trash2, CheckCircle2, Settings2,
  Compass
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  discoverRosterFields,
  type DiversityStrategy, 
  type DiversityGroupingResult,
  type GroupDiversityReport,
  type CustomDiversityField,
  type GroupingWeights
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
  { value: 'balanced_all', label: 'Multi-Dimensional (Gender + Nationality + University + English)' },
  { value: 'gender_first', label: 'Gender Parity First (50/50 Male-Female Priority)' },
  { value: 'nationality_first', label: 'Nationality & University Mixing First' },
  { value: 'degree_first', label: 'Degree & Field of Study Mixing First' },
  { value: 'custom', label: 'Custom Diversity Strategy (Custom Weights & Fields)' },
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

  // Custom Strategy & Weights State
  const [showCustomConfig, setShowCustomConfig] = useState<boolean>(false);
  const [weights, setWeights] = useState<GroupingWeights>({
    gender: 12,
    nationality: 8,
    university: 16,
    english: 6,
    degree: 10,
    studentType: 6
  });
  const [customFields, setCustomFields] = useState<CustomDiversityField[]>([]);

  // New Custom Field Builder Form
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldKey, setNewFieldKey] = useState<string>('');
  const [newFieldWeight, setNewFieldWeight] = useState<number>(15);
  const [newFieldMode, setNewFieldMode] = useState<'disperse' | 'cluster'>('disperse');

  // Confirmation Popups State
  const [showReshuffleModal, setShowReshuffleModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);

  // Student detail modal
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

  const discoveredFields = useMemo(() => discoverRosterFields(students), [students]);
  const effectivePrefix = prefix === 'custom' ? (customPrefix.trim() || 'Team') : prefix;

  // Automatically compute initial balanced partition upon opening or parameter changes
  useEffect(() => {
    if (isOpen && students.length > 0) {
      runOptimization();
    }
  }, [isOpen, students.length, targetSize, strategy, prefix, customPrefix, weights, customFields]);

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
        prefix: effectivePrefix,
        weights: strategy === 'custom' ? weights : undefined,
        customFields: (strategy === 'custom' || customFields.length > 0) ? customFields : undefined
      });
      setGroupingResult(result);
      setIsGenerating(false);
    }, 80);
  };

  const handleConfirmReshuffle = () => {
    setShowReshuffleModal(false);
    runOptimization();
  };

  const handleConfirmAssign = () => {
    setShowAssignModal(false);
    if (!groupingResult) return;
    onApplyGroups(groupingResult.updatedStudents);
    onClose();
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const finalKey = newFieldKey.trim() || newFieldName.trim().toLowerCase().replace(/[\s_-]+/g, '');
    const newField: CustomDiversityField = {
      id: `cf_${Date.now()}`,
      name: newFieldName.trim(),
      key: finalKey,
      weight: newFieldWeight,
      mode: newFieldMode
    };
    setCustomFields(prev => [...prev, newField]);
    setNewFieldName('');
    setNewFieldKey('');
    setNewFieldWeight(15);
    setNewFieldMode('disperse');
    if (strategy !== 'custom') setStrategy('custom');
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleAddDiscoveredField = (df: { key: string; name: string }, mode: 'disperse' | 'cluster' = 'disperse') => {
    if (customFields.some(f => f.key === df.key)) return;
    const newField: CustomDiversityField = {
      id: `cf_${Date.now()}`,
      name: df.name,
      key: df.key,
      weight: 15,
      mode
    };
    setCustomFields(prev => [...prev, newField]);
    if (strategy !== 'custom') setStrategy('custom');
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
  const activeStrategyObj = STRATEGY_OPTIONS.find(s => s.value === strategy);

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
          maxWidth: '1020px', 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
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
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(20, 184, 166, 0.2)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Intelligent Auto-Group Diversity Studio
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Combinatorial multi-objective balancing across gender parity, origins, academic majors, and custom criteria.
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
              gap: '1.1rem', 
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
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
                    style={{ fontWeight: 700, textAlign: 'center', minHeight: '40px', width: '90px' }}
                  />
                  <span className="badge badge-secondary" style={{ fontSize: '0.76rem', padding: '0.4rem 0.65rem' }}>
                    {numTeams} {numTeams === 1 ? 'Team' : 'Teams'} will be created
                  </span>
                </div>
              </div>

              {/* Strategy Select */}
              <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Sparkles size={15} className="text-primary" /> Optimization Model
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomConfig(prev => !prev)}
                    style={{ border: 'none', background: 'transparent', color: showCustomConfig ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                  >
                    <Sliders size={12} /> {showCustomConfig ? 'Hide Custom' : 'Custom Rules'}{customFields.length > 0 ? ` (${customFields.length})` : ''}
                  </button>
                </div>
                <CustomSelect
                  options={STRATEGY_OPTIONS}
                  value={strategy}
                  onChange={(val) => {
                    const newStrat = val as DiversityStrategy;
                    setStrategy(newStrat);
                    if (newStrat === 'custom') setShowCustomConfig(true);
                  }}
                />
              </div>

              {/* Prefix Select + Custom Option */}
              <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <Layers size={15} className="text-teal" /> Group Title Format
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

            {/* Custom Diversity Configuration Panel */}
            {(showCustomConfig || strategy === 'custom') && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <b style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Settings2 size={15} className="text-primary" /> Custom Diversity Weights &amp; Cohort Rules
                  </b>
                  {strategy !== 'custom' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setStrategy('custom')}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                    >
                      Set Strategy to Custom
                    </button>
                  )}
                </div>

                {/* Discovered Roster Fields */}
                {discoveredFields.length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      <Compass size={13} className="text-teal" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Detected Data Attributes in Cohort:
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {discoveredFields.map(df => {
                        const isAdded = customFields.some(f => f.key === df.key);
                        return (
                          <div key={df.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: isAdded ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-app)', border: `1px solid ${isAdded ? 'var(--accent-teal)' : 'var(--border-color)'}`, borderRadius: '5px', padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}>
                            <span style={{ fontWeight: 700 }}>{df.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>({df.distinctCount} vals)</span>
                            {!isAdded ? (
                              <button
                                type="button"
                                onClick={() => handleAddDiscoveredField(df, 'disperse')}
                                style={{ border: 'none', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--accent-teal)', borderRadius: '3px', padding: '0.05rem 0.3rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Add
                              </button>
                            ) : (
                              <span style={{ color: 'var(--accent-teal)', fontWeight: 800, fontSize: '0.65rem' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Standard Weights Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      <span>Gender Parity</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{weights.gender ?? 12}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights.gender ?? 12}
                      onChange={(e) => setWeights(prev => ({ ...prev, gender: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      <span>Campus Separation</span>
                      <span style={{ color: 'var(--accent-teal)', fontWeight: 800 }}>{weights.university ?? 16}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights.university ?? 16}
                      onChange={(e) => setWeights(prev => ({ ...prev, university: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      <span>Origin Dispersion</span>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>{weights.nationality ?? 8}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights.nationality ?? 8}
                      onChange={(e) => setWeights(prev => ({ ...prev, nationality: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#10b981' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                      <span>English Proficiency</span>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>{weights.english ?? 6}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights.english ?? 6}
                      onChange={(e) => setWeights(prev => ({ ...prev, english: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
                    />
                  </div>
                </div>

                {/* Inline New Custom Field Form */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Custom Field Name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    style={{ height: '32px', fontSize: '0.78rem', flex: '1 1 160px' }}
                  />
                  <select
                    value={newFieldMode}
                    onChange={(e) => setNewFieldMode(e.target.value as 'disperse' | 'cluster')}
                    className="form-input"
                    style={{ height: '32px', fontSize: '0.78rem', flex: '1 1 150px', padding: '0 0.4rem' }}
                  >
                    <option value="disperse">Disperse / Mix Evenly</option>
                    <option value="cluster">Cluster Similar Together</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-teal btn-sm"
                    onClick={handleAddCustomField}
                    disabled={!newFieldName.trim()}
                    style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>

                {/* Custom Fields List */}
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {customFields.map(cf => (
                      <span 
                        key={cf.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.74rem' }}
                      >
                        <b>{cf.name}</b>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>({cf.mode})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(cf.id)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {totalMembers} students registered • Partitioned into {numTeams} teams
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowReshuffleModal(true)}
                disabled={totalMembers === 0 || isGenerating}
                style={{ minHeight: '38px', padding: '0.35rem 0.95rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
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
                padding: '0.85rem 1.1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
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
                    fontSize: '0.85rem' 
                  }}
                >
                  {groupingResult.overallDiversityScore}%
                </div>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Diversity Index</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                    {groupingResult.overallDiversityScore >= 80 ? 'Optimal Mix' : 'Balanced Spread'}
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} />
                </div>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Gender Parity</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {groupingResult.genderBalanceRating}
                  </div>
                </div>
              </div>

              {/* Origin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} />
                </div>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Origin Dispersion</div>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                    {groupingResult.nationalityMixRating}
                  </div>
                </div>
              </div>

              {/* English */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Languages size={18} />
                </div>
                <div style={{ lineHeight: 1.25 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Language Spread</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                    {groupingResult.englishMixRating}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teams Grid */}
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
              Simulating optimal group permutations...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {groupingResult?.groups.map((grp) => (
                <div 
                  key={grp.groupName} 
                  className="card" 
                  style={{ 
                    padding: '0.85rem', 
                    margin: 0, 
                    backgroundColor: 'var(--bg-app)', 
                    border: '1px solid var(--border-color)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.65rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <b style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>{grp.groupName}</b>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                        {grp.studentCount} Students
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {grp.students.map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.45rem 0.6rem', 
                          backgroundColor: 'var(--bg-surface)', 
                          borderRadius: '6px', 
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.name}
                          </span>
                          {student.degree && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                              {student.degree}
                            </span>
                          )}
                          {renderStudentUniText(student)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          <span 
                            style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              padding: '0.1rem 0.35rem', 
                              borderRadius: '4px', 
                              backgroundColor: student.gender?.toLowerCase() === 'female' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                              color: student.gender?.toLowerCase() === 'female' ? '#ec4899' : '#3b82f6' 
                            }}
                          >
                            {student.gender || 'N/A'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                            {student.nationality || 'Unspecified'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Fields Summary Badges */}
                  {grp.customFieldSummaries && Object.keys(grp.customFieldSummaries).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingTop: '0.3rem', borderTop: '1px dashed var(--border-color)' }}>
                      {Object.values(grp.customFieldSummaries).map((cfSum, idx) => (
                        <span 
                          key={idx}
                          style={{ fontSize: '0.64rem', padding: '0.1rem 0.35rem', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        >
                          <b>{cfSum.fieldName}:</b> {cfSum.uniqueCount} unique
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div 
          style={{ 
            padding: '1.25rem 1.5rem', 
            borderTop: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            gap: '0.75rem',
            backgroundColor: 'var(--bg-app)'
          }}
        >
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
            onClick={() => setShowAssignModal(true)}
            disabled={!groupingResult || isGenerating}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Check size={16} /> Assign {numTeams} Teams to Course
          </button>
        </div>
      </div>

      {/* --- CONFIRMATION POPUP: RESHUFFLE TEAMS --- */}
      {showReshuffleModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '1rem'
          }}
          onClick={() => setShowReshuffleModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.14)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shuffle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Reshuffle Team Allocations?
              </h3>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>
                This will run a fresh multi-criteria combinatorial search to generate a newly balanced cohort grouping.
              </p>
              <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)', fontSize: '0.76rem' }}>
                <div>Strategy: <b>{activeStrategyObj?.label.split('(')[0].trim()}</b></div>
                <div>Students: <b>{totalMembers}</b> | Teams: <b>{numTeams}</b></div>
                {customFields.length > 0 && <div>Active Custom Criteria: <b>{customFields.length}</b></div>}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowReshuffleModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmReshuffle}
              >
                Yes, Reshuffle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION POPUP: ASSIGN TEAMS --- */}
      {showAssignModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '1rem'
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(20, 184, 166, 0.14)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Assign Teams to Course Roster?
              </h3>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>
                You are about to assign <b>{numTeams} teams</b> across <b>{totalMembers} students</b> in your active course roster.
              </p>
              {groupingResult && (
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)', fontSize: '0.76rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <div>Diversity Index: <b style={{ color: 'var(--accent-teal)' }}>{groupingResult.overallDiversityScore}%</b></div>
                  <div>Gender Balance: <b style={{ color: 'var(--primary)' }}>{groupingResult.genderBalanceRating}</b></div>
                </div>
              )}
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmAssign}
              >
                Confirm &amp; Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001,
            padding: '1rem'
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedStudent.name}
              </h3>
              <button 
                type="button" 
                onClick={() => setSelectedStudent(null)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
              <div>Email: <b>{selectedStudent.email}</b></div>
              <div>Team: <b>{selectedStudent.groupName || 'Unassigned'}</b></div>
              <div>Gender: <b>{selectedStudent.gender || 'Unspecified'}</b></div>
              <div>Nationality: <b>{selectedStudent.nationality || 'Unspecified'}</b></div>
              <div>University: <b>{selectedStudent.university || 'Unspecified'}</b></div>
              <div>Degree: <b>{selectedStudent.degree || 'Unspecified'}</b></div>
            </div>
            <div style={{ padding: '0.8rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Single Team Modal */}
      {exportModal.isOpen && exportModal.team && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001,
            padding: '1rem'
          }}
          onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Export {exportModal.team.groupName}
              </h3>
              <button 
                type="button" 
                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setExportModal(prev => ({ ...prev, format: 'xlsx' }))}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: `2px solid ${exportModal.format === 'xlsx' ? 'var(--accent-teal)' : 'var(--border-color)'}`, background: 'var(--bg-app)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setExportModal(prev => ({ ...prev, format: 'csv' }))}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: `2px solid ${exportModal.format === 'csv' ? 'var(--accent-teal)' : 'var(--border-color)'}`, background: 'var(--bg-app)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  CSV Format
                </button>
              </div>
            </div>
            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={handleExecuteExport}
              >
                Download
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
