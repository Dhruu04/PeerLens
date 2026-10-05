import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, RefreshCw, Globe, 
  Shuffle, BarChart2,
  Languages, UserCheck, Layers, ChevronDown, ChevronUp,
  LayoutGrid, Kanban, GripVertical, Download, FileSpreadsheet,
  FileText, X, GraduationCap, Plane,
  Sliders, Plus, Trash2, AlertCircle, CheckCircle2,
  Settings2, Split, Merge, Compass
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  calculateGroupReport,
  discoverRosterFields,
  type DiversityStrategy, 
  type DiversityGroupingResult,
  type GroupDiversityReport,
  type CustomDiversityField,
  type GroupingWeights,
  getStudentFieldValue
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
  { value: 'balanced_all', label: 'Multi-Dimensional (Gender + Origin + Campus + Language)' },
  { value: 'gender_first', label: 'Gender Parity First (50/50 Male-Female Priority)' },
  { value: 'nationality_first', label: 'Nationality & Cross-Border Mixing First' },
  { value: 'degree_first', label: 'Degree & Field of Study Mixing First' },
  { value: 'custom', label: 'Custom Diversity Strategy (Custom Weights & Fields)' },
  { value: 'random_fast', label: 'Standard Equal-Size Distribution' }
];

const PREFIX_OPTIONS = [
  { value: 'Team', label: 'Team (1, 2...)' },
  { value: 'Group', label: 'Group (1, 2...)' },
  { value: 'Squad', label: 'Squad (1, 2...)' },
  { value: 'Cohort', label: 'Cohort (1, 2...)' },
  { value: 'Project Group', label: 'Project Group' },
  { value: 'custom', label: 'Custom Prefix...' }
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

  // Custom Strategy & Dynamic Weights State
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

  // Discover populated fields from current roster
  const discoveredFields = useMemo(() => discoverRosterFields(students), [students]);

  // Master Collapse / Expand listener
  useEffect(() => {
    const handleCollapse = () => setIsExpanded(false);
    const handleExpand = () => setIsExpanded(true);
    window.addEventListener('peerlens_collapse_all', handleCollapse);
    window.addEventListener('peerlens_expand_all', handleExpand);
    return () => {
      window.removeEventListener('peerlens_collapse_all', handleCollapse);
      window.removeEventListener('peerlens_expand_all', handleExpand);
    };
  }, []);

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

  const effectivePrefix = prefix === 'custom' ? (customPrefix.trim() || 'Team') : prefix;

  // Run calculation whenever parameters or custom fields change
  useEffect(() => {
    if (students.length > 0) {
      runOptimization();
    }
  }, [students.length, targetSize, strategy, prefix, customPrefix, weights, customFields]);

  const runOptimization = () => {
    if (students.length === 0) return;
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
    }, 60);
  };

  // Move student between groups manually in Kanban
  const handleMoveStudent = (studentId: string, targetGroupName: string) => {
    if (!groupingResult) return;

    const currentStudent = groupingResult.updatedStudents.find(s => s.id === studentId);
    if (!currentStudent || currentStudent.groupName === targetGroupName) return;

    const newStudents = groupingResult.updatedStudents.map(s => 
      s.id === studentId ? { ...s, groupName: targetGroupName } : s
    );

    const groupMap: Record<string, Student[]> = {};
    newStudents.forEach(s => {
      const gName = s.groupName || 'Unassigned';
      if (!groupMap[gName]) groupMap[gName] = [];
      groupMap[gName].push(s);
    });

    const newGroups: GroupDiversityReport[] = Object.entries(groupMap).map(([gName, sList]) => 
      calculateGroupReport(gName, sList, 3.5, customFields)
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
      englishMixRating: groupingResult.englishMixRating,
      customFieldRating: groupingResult.customFieldRating
    });
  };

  const handleConfirmReshuffle = () => {
    setShowReshuffleModal(false);
    runOptimization();
  };

  const handleConfirmAssign = () => {
    setShowAssignModal(false);
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
    if (strategy !== 'custom') {
      setStrategy('custom');
    }
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const handleAddDiscoveredField = (df: { key: string; name: string }, mode: 'disperse' | 'cluster' = 'disperse') => {
    if (customFields.some(f => f.key === df.key)) {
      return;
    }
    const newField: CustomDiversityField = {
      id: `cf_${Date.now()}`,
      name: df.name,
      key: df.key,
      weight: 15,
      mode
    };
    setCustomFields(prev => [...prev, newField]);
    if (strategy !== 'custom') {
      setStrategy('custom');
    }
  };

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

  return (
    <div 
      className="card" 
      style={{ 
        borderLeft: '4px solid var(--accent-teal)', 
        backgroundColor: 'var(--bg-surface)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-md)',
        transition: 'all 200ms ease',
        position: 'relative'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              backgroundColor: 'rgba(20, 184, 166, 0.12)', 
              color: 'var(--accent-teal)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(20, 184, 166, 0.2)',
              flexShrink: 0
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Intelligent Auto-Group &amp; Diversity Studio
              </h3>
              <FeatureInfoButton featureId="auto-group-studio" size="sm" tooltipText="Learn about Auto-Group Studio" />
              {groupingResult && (
                <span 
                  className="badge badge-teal" 
                  style={{ 
                    fontSize: '0.74rem', 
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    boxShadow: '0 2px 6px rgba(20, 184, 166, 0.15)'
                  }}
                >
                  {groupingResult.overallDiversityScore}% Balance Score
                </span>
              )}
              {customFields.length > 0 && (
                <span 
                  className="badge badge-indigo" 
                  style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem' }}
                >
                  {customFields.length} Custom Rule{customFields.length > 1 ? 's' : ''} Active
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Multi-objective combinatorial optimization: balances gender parity, international origins, academic majors, English proficiency, and custom cohort criteria.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
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
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            {/* 1. Top Controls & Strategy Bar */}
            <div 
              style={{
                padding: '0.9rem 1.1rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.85rem',
                alignItems: 'flex-end',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Target Size with Quick Stepper */}
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
                <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                  <Users size={13} className="text-teal" /> Target Team Size
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
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 210px', minWidth: '170px', maxWidth: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontSize: '0.76rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                    <Sparkles size={13} className="text-primary" /> Diversity Strategy
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomConfig(prev => !prev)}
                    style={{ 
                      border: 'none', 
                      background: 'transparent', 
                      color: showCustomConfig || strategy === 'custom' ? 'var(--primary)' : 'var(--text-muted)', 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem', 
                      padding: '0 2px' 
                    }}
                    title="Customize criteria weights and custom fields"
                  >
                    <Sliders size={12} /> {showCustomConfig ? 'Hide Custom Rules' : 'Customize Criteria'}{customFields.length > 0 ? ` (${customFields.length})` : ''}
                  </button>
                </div>
                <CustomSelect
                  options={STRATEGY_OPTIONS}
                  value={strategy}
                  onChange={(val) => {
                    const newStrat = val as DiversityStrategy;
                    setStrategy(newStrat);
                    if (newStrat === 'custom') {
                      setShowCustomConfig(true);
                    }
                  }}
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
              <div className="form-group" style={{ margin: 0, display: 'flex', gap: '0.45rem', height: '36px', flexShrink: 0, marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowReshuffleModal(true)}
                  disabled={totalMembers === 0 || isGenerating}
                  style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  title="Re-calculate a new optimal permutation"
                >
                  <Shuffle size={13} /> Re-Shuffle
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAssignModal(true)}
                  disabled={totalMembers === 0 || isGenerating}
                  style={{ height: '36px', padding: '0 1rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                  title="Assign generated groups to active roster"
                >
                  <Check size={14} /> Assign Teams
                </button>
              </div>
            </div>

            {/* Custom Diversity Strategy & Custom Fields Deck */}
            {(showCustomConfig || strategy === 'custom') && (
              <div 
                style={{ 
                  borderTop: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-surface)', 
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Settings2 size={16} className="text-primary" /> Custom Diversity Strategy &amp; Attribute Matrix
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Fine-tune optimization weights for standard criteria or configure custom student fields to steer team composition.
                    </p>
                  </div>
                  {strategy !== 'custom' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setStrategy('custom')}
                      style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem' }}
                    >
                      Set Strategy to Custom
                    </button>
                  )}
                </div>

                {/* Detected Roster Attributes (Smart Discovery) */}
                {discoveredFields.length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <Compass size={14} className="text-teal" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Detected Data Attributes in Your Roster ({discoveredFields.length})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— click to add as active diversity rule:</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {discoveredFields.map(df => {
                        const isAlreadyAdded = customFields.some(f => f.key === df.key);
                        return (
                          <div
                            key={df.key}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              backgroundColor: isAlreadyAdded ? 'rgba(20, 184, 166, 0.12)' : 'var(--bg-surface)',
                              border: `1px solid ${isAlreadyAdded ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                              borderRadius: '6px',
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.72rem'
                            }}
                          >
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{df.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: '0.05rem 0.3rem', borderRadius: '4px' }}>
                              {df.distinctCount} values ({df.count} students)
                            </span>
                            {!isAlreadyAdded ? (
                              <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleAddDiscoveredField(df, 'disperse')}
                                  style={{ border: 'none', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--accent-teal)', borderRadius: '3px', padding: '0.1rem 0.35rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                                  title={`Disperse & mix ${df.name} evenly across teams`}
                                >
                                  <Split size={10} /> Disperse
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddDiscoveredField(df, 'cluster')}
                                  style={{ border: 'none', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderRadius: '3px', padding: '0.1rem 0.35rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                                  title={`Cluster & keep students with same ${df.name} together`}
                                >
                                  <Merge size={10} /> Cluster
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: 'var(--accent-teal)', fontWeight: 800 }}>✓ Active</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Standard Weights Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', backgroundColor: 'var(--bg-app)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {/* Gender Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Gender Parity (50/50)</span>
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

                  {/* University Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Campus / Uni Separation</span>
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

                  {/* Nationality Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Origin &amp; Country Dispersion</span>
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

                  {/* English Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>CEFR English Balance</span>
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

                  {/* Degree / Major Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Degree / Field of Study</span>
                      <span style={{ color: '#8b5cf6', fontWeight: 800 }}>{weights.degree ?? 10}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights.degree ?? 10}
                      onChange={(e) => setWeights(prev => ({ ...prev, degree: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#8b5cf6' }}
                    />
                  </div>

                  {/* Student Type Weight */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', fontWeight: 700, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span>Mobility (Erasmus / Regular)</span>
                      <span style={{ color: '#ec4899', fontWeight: 800 }}>{weights.studentType ?? 6}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={weights.studentType ?? 6}
                      onChange={(e) => setWeights(prev => ({ ...prev, studentType: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#ec4899' }}
                    />
                  </div>
                </div>

                {/* Custom Fields Builder & Active List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Add Custom Cohort Field / Custom Criteria
                  </span>

                  {/* Add New Custom Field Form */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.55rem', 
                      alignItems: 'center', 
                      backgroundColor: 'var(--bg-app)', 
                      padding: '0.75rem 0.9rem', 
                      borderRadius: '8px', 
                      border: '1px dashed var(--border-color)' 
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Field Name (e.g. Specialization, Track, Skill)"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      style={{ height: '34px', fontSize: '0.8rem', flex: '1 1 180px', minWidth: '150px' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Property Key (e.g. skill, track)"
                      value={newFieldKey}
                      onChange={(e) => setNewFieldKey(e.target.value)}
                      style={{ height: '34px', fontSize: '0.8rem', flex: '1 1 140px', minWidth: '120px' }}
                    />
                    <select
                      value={newFieldMode}
                      onChange={(e) => setNewFieldMode(e.target.value as 'disperse' | 'cluster')}
                      className="form-input"
                      style={{ height: '34px', fontSize: '0.8rem', flex: '1 1 190px', minWidth: '160px', padding: '0 0.5rem' }}
                    >
                      <option value="disperse">Disperse / Mix Evenly across teams</option>
                      <option value="cluster">Cluster / Keep similar members together</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>Weight:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={newFieldWeight}
                        onChange={(e) => setNewFieldWeight(Number(e.target.value))}
                        className="form-input"
                        style={{ width: '54px', height: '34px', fontSize: '0.8rem', padding: '2px 4px', textAlign: 'center' }}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-teal btn-sm"
                      onClick={handleAddCustomField}
                      disabled={!newFieldName.trim()}
                      style={{ height: '34px', padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={14} /> Add Criterion
                    </button>
                  </div>

                  {/* Active Custom Fields List */}
                  {customFields.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
                      {customFields.map((field) => {
                        const populatedCount = students.filter(s => getStudentFieldValue(s, field.key, field.name)).length;
                        return (
                          <div 
                            key={field.id}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.6rem 0.85rem', 
                              borderRadius: '8px', 
                              backgroundColor: 'var(--bg-surface)', 
                              border: '1px solid var(--border-color)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '0.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <b style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {field.name}
                                </b>
                                <span 
                                  className={`badge ${field.mode === 'disperse' ? 'badge-teal' : 'badge-amber'}`}
                                  style={{ fontSize: '0.62rem', padding: '0.05rem 0.4rem', textTransform: 'uppercase', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                  {field.mode === 'disperse' ? <Split size={10} /> : <Merge size={10} />}
                                  {field.mode}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                Property: <code style={{ fontSize: '0.68rem', padding: '1px 4px', backgroundColor: 'var(--bg-app)', borderRadius: '3px' }}>{field.key}</code> • {populatedCount}/{totalMembers} students populated
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', padding: '0.2rem 0.45rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }}>
                                W: {field.weight}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomField(field.id)}
                                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                title="Remove custom criteria"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Integrated Diversity Health Strip */}
            {groupingResult && (
              <div 
                style={{ 
                  borderTop: '1px solid var(--border-color)', 
                  backgroundColor: 'var(--bg-surface)', 
                  padding: '0.65rem 1.1rem', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', 
                  gap: '0.85rem', 
                  alignItems: 'center' 
                }}
              >
                {/* Overall Index */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div 
                    style={{ 
                      minWidth: '48px', 
                      padding: '0 0.4rem', 
                      height: '32px', 
                      borderRadius: '7px', 
                      backgroundColor: 'rgba(20, 184, 166, 0.14)', 
                      color: 'var(--accent-teal)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '0.84rem', 
                      flexShrink: 0 
                    }}
                  >
                    {groupingResult.overallDiversityScore}%
                  </div>
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Team Balance Index</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                      {groupingResult.overallDiversityScore >= 80 ? 'Optimal Dispersion' : 'Balanced Spread'}
                    </div>
                  </div>
                </div>

                {/* Gender Balance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={16} />
                  </div>
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Gender Parity</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {groupingResult.genderBalanceRating} Distribution
                    </div>
                  </div>
                </div>

                {/* Nationality & Origin Diversity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={16} />
                  </div>
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Origin Dispersion</div>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                      {groupingResult.nationalityMixRating}
                    </div>
                  </div>
                </div>

                {/* Language Proficiency Spread */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Languages size={16} />
                  </div>
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>Language Spread</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
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
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Generated Team Rosters ({numTeams} Teams, {totalMembers} Students)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                • Click any member for detailed academic profile
              </span>
            </div>

            {/* Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-app)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem', border: 'none' }}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={13} /> Grid View
              </button>

              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem', border: 'none' }}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={13} /> Drag &amp; Drop Kanban
              </button>
            </div>
          </div>

          {/* Generated Teams Preview */}
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--primary)' }} />
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
                minHeight: '400px' 
              }}
            >
              {groupingResult?.groups.map((grp) => (
                <div
                  key={grp.groupName}
                  style={{
                    flex: '0 0 320px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    maxHeight: '520px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
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
                      <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
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

                  {/* Student Cards in Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
                    {grp.students.map((student) => (
                      <div
                        key={student.id}
                        draggable
                        onDragStart={() => setDraggedStudentId(student.id)}
                        onClick={() => setSelectedStudent(student)}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '7px',
                          padding: '0.6rem 0.7rem',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                            <GripVertical size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <b style={{ fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {student.name}
                            </b>
                          </div>
                          <span 
                            style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              padding: '0.1rem 0.35rem', 
                              borderRadius: '4px', 
                              backgroundColor: student.gender?.toLowerCase() === 'female' ? 'rgba(236, 72, 153, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                              color: student.gender?.toLowerCase() === 'female' ? '#ec4899' : '#3b82f6',
                              flexShrink: 0
                            }}
                          >
                            {student.gender || 'N/A'}
                          </span>
                        </div>

                        {student.degree && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {student.degree}
                          </div>
                        )}

                        {renderStudentUniText(student)}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Globe size={11} style={{ opacity: 0.7 }} /> {student.nationality || 'Unspecified'}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>
                            {student.englishProficiency?.split(' ')[0] || 'Fluent'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Fields Summary Bar in Column */}
                  {grp.customFieldSummaries && Object.keys(grp.customFieldSummaries).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)' }}>
                      {Object.values(grp.customFieldSummaries).map((cfSum, idx) => (
                        <span 
                          key={idx}
                          style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        >
                          <b>{cfSum.fieldName}:</b> {cfSum.uniqueCount} unique ({cfSum.score}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* --- GRID VIEW --- */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.1rem' }}>
              {groupingResult?.groups.map((grp) => (
                <div 
                  key={grp.groupName} 
                  className="card" 
                  style={{ 
                    padding: '0.95rem', 
                    margin: 0, 
                    backgroundColor: 'var(--bg-app)', 
                    border: '1px solid var(--border-color)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.65rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <b style={{ fontSize: '0.96rem', color: 'var(--text-primary)' }}>{grp.groupName}</b>
                      <span className="badge badge-secondary" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                        {grp.studentCount} Students
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        {grp.diversityScore}% Balance
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

                  {/* Members List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {grp.students.map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.5rem 0.65rem', 
                          backgroundColor: 'var(--bg-surface)', 
                          borderRadius: '7px', 
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.name}
                          </span>
                          {student.degree && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {student.degree}
                            </span>
                          )}
                          {renderStudentUniText(student)}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span 
                              style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 700, 
                                padding: '0.08rem 0.35rem', 
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
                          <span style={{ fontSize: '0.66rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                            {student.englishProficiency?.split(' ')[0] || 'Fluent'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Fields Summary Badges inside Team Card */}
                  {grp.customFieldSummaries && Object.keys(grp.customFieldSummaries).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)' }}>
                      {Object.values(grp.customFieldSummaries).map((cfSum, idx) => (
                        <span 
                          key={idx}
                          style={{ 
                            fontSize: '0.66rem', 
                            padding: '0.15rem 0.45rem', 
                            borderRadius: '4px', 
                            backgroundColor: 'var(--bg-surface)', 
                            border: '1px solid var(--border-color)', 
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <b>{cfSum.fieldName}:</b> {cfSum.uniqueCount} distinct ({cfSum.score}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* --- CONFIRMATION POPUP: RESHUFFLE TEAMS --- */}
      {showReshuffleModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setShowReshuffleModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
              animation: 'popIn 160ms ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.14)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shuffle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Reshuffle Team Allocations?
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Simulated Annealing Diversity Optimizer
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to reshuffle the team allocations? This will run a fresh multi-criteria combinatorial search to generate a newly balanced cohort grouping.
              </p>

              {/* Parameter Preview Card */}
              <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Classroom Cohort:</span>
                  <b style={{ color: 'var(--text-primary)' }}>{totalMembers} Students</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Team Size:</span>
                  <b style={{ color: 'var(--text-primary)' }}>~{targetSize} per team ({numTeams} Teams)</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Active Strategy:</span>
                  <b style={{ color: 'var(--accent-teal)' }}>{activeStrategyObj?.label.split('(')[0].trim()}</b>
                </div>
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Custom Criteria:</span>
                    <b style={{ color: 'var(--primary)' }}>{customFields.length} active custom rule{customFields.length > 1 ? 's' : ''}</b>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReshuffleModal(false)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReshuffle}
                style={{ fontSize: '0.82rem', padding: '0.4rem 1.15rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Shuffle size={14} /> Yes, Reshuffle Teams
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- CONFIRMATION POPUP: ASSIGN TEAMS --- */}
      {showAssignModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setShowAssignModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
              animation: 'popIn 160ms ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(20, 184, 166, 0.14)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Confirm Team Assignment to Roster
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Apply Generated Teams to Active Classroom
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                You are about to assign <b>{numTeams} teams</b> to <b>{totalMembers} students</b> in your active course roster. This will update their team memberships for peer evaluations and grade calculations.
              </p>

              {/* Health Score Summary Card */}
              {groupingResult && (
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Diversity Index:</span>
                    <b style={{ color: 'var(--accent-teal)', fontSize: '0.94rem' }}>{groupingResult.overallDiversityScore}%</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Gender Balance:</span>
                    <b style={{ color: 'var(--primary)' }}>{groupingResult.genderBalanceRating}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Origin Dispersion:</span>
                    <b style={{ color: '#10b981' }}>{groupingResult.nationalityMixRating}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Language Spread:</span>
                    <b style={{ color: 'var(--accent-amber)' }}>{groupingResult.englishMixRating}</b>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>Existing manual groups will be safely updated to the newly generated team roster.</span>
              </div>
            </div>

            <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAssignModal(false)}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmAssign}
                style={{ fontSize: '0.82rem', padding: '0.4rem 1.2rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Check size={14} /> Confirm &amp; Assign Teams
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- STUDENT DETAIL MODAL --- */}
      {selectedStudent && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedStudent.name}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {selectedStudent.groupName || 'Unassigned'} • ID: {selectedStudent.id}
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedStudent(null)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                  <b style={{ fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedStudent.email}</b>
                </div>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Gender Identity</span>
                  <b style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{selectedStudent.gender || 'Unspecified'}</b>
                </div>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Nationality / Origin</span>
                  <b style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{selectedStudent.nationality || 'Unspecified'}</b>
                </div>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Language Proficiency</span>
                  <b style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{selectedStudent.englishProficiency || 'Fluent (C1/C2)'}</b>
                </div>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>University / Campus</span>
                  <b style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{selectedStudent.university || 'Unspecified'}</b>
                </div>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem 0.8rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Degree / Field</span>
                  <b style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{selectedStudent.degree || 'Unspecified'}</b>
                </div>
              </div>

              {/* Custom Attributes Section */}
              {customFields.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.75rem 0.85rem', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                    Custom Diversity Attributes
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {customFields.map(cf => (
                      <div key={cf.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{cf.name}:</span>
                        <b style={{ color: 'var(--text-primary)' }}>
                          {getStudentFieldValue(selectedStudent, cf.key, cf.name) || 'Not Set'}
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- EXPORT SINGLE TEAM MODAL --- */}
      {exportModal.isOpen && exportModal.team && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
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
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Export {exportModal.team.groupName}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {exportModal.team.studentCount} Members • {exportModal.team.diversityScore}% Diversity
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Format Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'block' }}>
                  1. Choose Export Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setExportModal(prev => ({ ...prev, format: 'xlsx' }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: `2px solid ${exportModal.format === 'xlsx' ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                      backgroundColor: exportModal.format === 'xlsx' ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <FileSpreadsheet size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    <div>
                      <b style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>Excel (.xlsx)</b>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Formatted Workbook</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportModal(prev => ({ ...prev, format: 'csv' }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '8px',
                      border: `2px solid ${exportModal.format === 'csv' ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                      backgroundColor: exportModal.format === 'csv' ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-app)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <FileText size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div>
                      <b style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>CSV Format</b>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Comma-Separated</span>
                    </div>
                  </button>
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
