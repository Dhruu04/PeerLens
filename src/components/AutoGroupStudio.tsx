import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, Globe, 
  Shuffle, Languages, Layers, ChevronDown, ChevronUp,
  LayoutGrid, Kanban, GripVertical, Download, FileSpreadsheet,
  FileText, X, GraduationCap, Plane, Table, Columns3, ArrowRightLeft,
  Sliders, Plus, Trash2, AlertCircle, CheckCircle2,
  Settings2, Compass, ShieldAlert, Search, RotateCcw,
  Pin, PinOff, Undo2, Redo2, Target, Zap, ArrowRight
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  calculateGroupReport,
  discoverRosterFields,
  DEFAULT_GROUPING_RULES,
  type GroupingRule,
  type GroupingRuleMode,
  type DiversityGroupingResult,
  type GroupDiversityReport
} from '../utils/grouping';
import { exportSingleTeamToCSV, exportSingleTeamToExcel } from '../utils/csv';
import CustomSelect from './CustomSelect';

interface AutoGroupStudioProps {
  students: Student[];
  onApplyGroups: (updatedStudents: Student[]) => void;
  onLoadSampleStudents?: () => void;
  defaultExpanded?: boolean;
  onOpenTeamCharter?: () => void;
}

const PREFIX_OPTIONS = [
  { value: 'Team', label: 'Team (e.g. Team 1, Team 2)' },
  { value: 'Group', label: 'Group (e.g. Group 1, Group 2)' },
  { value: 'Squad', label: 'Squad (e.g. Squad 1, Squad 2)' },
  { value: 'Cohort', label: 'Cohort (e.g. Cohort 1, Cohort 2)' },
  { value: 'Project Group', label: 'Project Group (e.g. Project Group 1)' },
  { value: 'custom', label: 'Custom Prefix...' }
];

const RULE_PALETTE = [
  '#0d9488', // Teal
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];



export const AutoGroupStudio: React.FC<AutoGroupStudioProps> = ({
  students,
  onApplyGroups,
  onLoadSampleStudents,
  defaultExpanded = false,
  onOpenTeamCharter
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [targetSize, setTargetSize] = useState<number>(4);
  const [prefix, setPrefix] = useState<string>('Team');
  const [customPrefix, setCustomPrefix] = useState<string>('Pod');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'table' | 'compact'>('grid');
  const [kanbanLayout, setKanbanLayout] = useState<'wrap' | 'scroll' | 'compact'>('wrap');
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  // Custom Rules State with LocalStorage Persistence
  const [rules, setRules] = useState<GroupingRule[]>(() => {
    try {
      const saved = localStorage.getItem('peerlens_custom_grouping_rules_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load grouping rules from storage', e);
    }
    return DEFAULT_GROUPING_RULES;
  });



  // Pinned / Locked Students State
  const [pinnedStudentIds, setPinnedStudentIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Student[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Grouping Calculation Result
  const [groupingResult, setGroupingResult] = useState<DiversityGroupingResult | null>(null);

  // Weight Control Mode: Simplified Tiers vs Precise Sliders
  const [weightControlMode, setWeightControlMode] = useState<'simplified' | 'precise'>(() => {
    try {
      return (localStorage.getItem('peerlens_weight_control_mode') as 'simplified' | 'precise') || 'simplified';
    } catch {
      return 'simplified';
    }
  });

  const handleSetWeightControlMode = (mode: 'simplified' | 'precise') => {
    setWeightControlMode(mode);
    try {
      localStorage.setItem('peerlens_weight_control_mode', mode);
    } catch (e) {
      console.error('Failed to save weight control mode', e);
    }
  };

  // Modals State
  const [showReshuffleModal, setShowReshuffleModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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

  const activeRules = useMemo(() => rules.filter(r => r.enabled && r.weight > 0), [rules]);
  const totalActiveWeight = useMemo(() => activeRules.reduce((sum, r) => sum + r.weight, 0), [activeRules]);

  useEffect(() => {
    try {
      localStorage.setItem('peerlens_custom_grouping_rules_v2', JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save grouping rules', e);
    }
  }, [rules]);

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

  useEffect(() => {
    if (students.length > 0) {
      runOptimization();
    }
  }, [students.length, targetSize, prefix, customPrefix, rules]);

  // Global Keyboard Shortcuts for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Global window drag listeners to cleanly reset states
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedStudentId(null);
      setDragOverGroupId(null);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

  const runOptimization = () => {
    if (students.length === 0) return;
    setIsGenerating(true);

    // Build pinned student map (studentId -> current groupName)
    const pinnedStudentMap: Record<string, string> = {};
    if (groupingResult && pinnedStudentIds.size > 0) {
      groupingResult.updatedStudents.forEach(s => {
        if (pinnedStudentIds.has(s.id) && s.groupName) {
          pinnedStudentMap[s.id] = s.groupName;
        }
      });
    }

    setTimeout(() => {
      const result = generateDiverseGroups(students, {
        targetSize,
        prefix: effectivePrefix,
        rules,
        pinnedStudentMap: Object.keys(pinnedStudentMap).length > 0 ? pinnedStudentMap : undefined
      });
      setGroupingResult(result);
      setHistory([result.updatedStudents]);
      setHistoryIndex(0);
      setIsGenerating(false);
    }, 60);
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleWeightChange = (id: string, weight: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, weight } : r));
  };

  const handleModeChange = (id: string, mode: GroupingRuleMode) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, mode } : r));
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleResetToDefaults = () => {
    setRules(DEFAULT_GROUPING_RULES);
  };

  const handleClearAllRules = () => {
    setRules([]);
  };



  const handleQuickAddDiscoveredField = (df: { key: string; name: string }) => {
    if (rules.some(r => r.fieldKey === df.key)) return;
    const newRule: GroupingRule = {
      id: `discovered_rule_${Date.now()}_${df.key}`,
      name: `${df.name} Diversity`,
      fieldKey: df.key,
      mode: 'disperse',
      weight: 18,
      enabled: true,
      description: `Disperse students by ${df.name} across teams`
    };
    setRules(prev => [...prev, newRule]);
  };

  // Pinning Handlers
  const handleTogglePin = (studentId: string) => {
    setPinnedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleUnpinAll = () => {
    setPinnedStudentIds(new Set());
  };

  const applyNewStudentAssignment = (newStudents: Student[], pushToHistory = true) => {
    if (!groupingResult) return;

    const groupMap: Record<string, Student[]> = {};
    newStudents.forEach(s => {
      const gName = s.groupName || 'Unassigned';
      if (!groupMap[gName]) groupMap[gName] = [];
      groupMap[gName].push(s);
    });

    const allGroupNames = groupingResult.groups.map(g => g.groupName);
    const newGroups: GroupDiversityReport[] = allGroupNames.map(gName => {
      const sList = groupMap[gName] || [];
      return calculateGroupReport(gName, sList, 3.5, activeRules);
    });

    const avgScore = newGroups.length > 0 
      ? Math.round(newGroups.reduce((acc, g) => acc + g.diversityScore, 0) / newGroups.length)
      : 0;

    setGroupingResult({
      groups: newGroups,
      updatedStudents: newStudents,
      overallDiversityScore: avgScore,
      activeRulesCount: activeRules.length,
      overallRuleBreakdown: groupingResult.overallRuleBreakdown,
      genderBalanceRating: groupingResult.genderBalanceRating,
      nationalityMixRating: groupingResult.nationalityMixRating,
      englishMixRating: groupingResult.englishMixRating,
      customFieldRating: groupingResult.customFieldRating
    });

    if (pushToHistory) {
      setHistory(prev => {
        const next = [...prev.slice(0, historyIndex + 1), newStudents];
        setHistoryIndex(next.length - 1);
        return next;
      });
    }
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetState = history[prevIndex];
      setHistoryIndex(prevIndex);
      applyNewStudentAssignment(targetState, false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = history[nextIndex];
      setHistoryIndex(nextIndex);
      applyNewStudentAssignment(targetState, false);
    }
  };

  const handleMoveStudent = (studentId: string, targetGroupName: string) => {
    if (!groupingResult) return;

    const currentStudent = groupingResult.updatedStudents.find(s => s.id === studentId);
    if (!currentStudent || currentStudent.groupName === targetGroupName) return;

    const newStudents = groupingResult.updatedStudents.map(s => 
      s.id === studentId ? { ...s, groupName: targetGroupName } : s
    );

    applyNewStudentAssignment(newStudents, true);
  };

  // What-If Group Balancing Simulator
  const simulationReports = useMemo(() => {
    if (!draggedStudentId || !groupingResult) return null;
    const student = groupingResult.updatedStudents.find(s => s.id === draggedStudentId);
    if (!student) return null;
    const currentGroupName = student.groupName;
    const result: Record<string, { currentScore: number; simulatedScore: number; delta: number }> = {};
    groupingResult.groups.forEach(group => {
      const currentScore = group.diversityScore;
      let simulatedStudents: Student[];
      if (group.groupName === currentGroupName) {
        simulatedStudents = group.students.filter(s => s.id !== draggedStudentId);
      } else {
        simulatedStudents = [...group.students, { ...student, groupName: group.groupName }];
      }
      const simulatedReport = calculateGroupReport(group.groupName, simulatedStudents, 3.5, activeRules);
      const delta = simulatedReport.diversityScore - currentScore;
      result[group.groupName] = { currentScore, simulatedScore: simulatedReport.diversityScore, delta };
    });
    return result;
  }, [draggedStudentId, groupingResult, activeRules]);

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

  const totalMembers = students.length;
  const numTeams = groupingResult ? groupingResult.groups.length : Math.ceil(totalMembers / targetSize);

  const getRuleIcon = (fieldKey: string) => {
    switch (fieldKey) {
      case 'gender': return <Users size={16} className="text-primary" />;
      case 'university': return <GraduationCap size={16} className="text-teal" />;
      case 'nationality': return <Globe size={16} style={{ color: '#10b981' }} />;
      case 'englishProficiency': return <Languages size={16} style={{ color: '#f59e0b' }} />;
      case 'degree': return <Layers size={16} style={{ color: '#ec4899' }} />;
      case 'studentType': return <Plane size={16} style={{ color: '#06b6d4' }} />;
      default: return <Sliders size={16} style={{ color: 'var(--primary)' }} />;
    }
  };



  const renderStudentUniText = (student: Student) => {
    if (student.isExchange && student.originalUniversity && student.currentUniversity) {
      return (
        <span 
          style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
          title={`Exchange: ${student.originalUniversity} (${student.originalCountry || 'Home'}) to ${student.currentUniversity} (${student.currentCountry || 'Host'})`}
        >
          <Plane size={11} className="text-teal" style={{ flexShrink: 0 }} />
          <span>{student.originalUniversity}</span>
          <ArrowRight size={10} style={{ opacity: 0.7, flexShrink: 0 }} />
          <span>{student.currentUniversity}</span>
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
    <div className="accordion-item" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'visible', backgroundColor: 'var(--bg-surface)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', marginBottom: '1.25rem' }}>
      {/* Studio Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '1rem 1.25rem', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: isExpanded ? 'var(--bg-app)' : 'var(--bg-surface)',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          borderTopLeftRadius: 'calc(var(--radius-lg) - 1px)',
          borderTopRightRadius: 'calc(var(--radius-lg) - 1px)',
          borderBottomLeftRadius: isExpanded ? '0' : 'calc(var(--radius-lg) - 1px)',
          borderBottomRightRadius: isExpanded ? '0' : 'calc(var(--radius-lg) - 1px)',
          transition: 'background-color 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px var(--primary-glow)'
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Intelligent Auto-Group &amp; Diversity Studio
              </span>
              {activeRules.length > 0 && (
                <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                  {activeRules.length} Active {activeRules.length === 1 ? 'Rule' : 'Rules'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Create custom multi-attribute grouping rules, adjust individual weightages, and balance teams with simulated annealing optimization.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {groupingResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rule Compliance:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)' }}>
                {groupingResult.overallDiversityScore}%
              </span>
            </div>
          )}
          <button
            type="button"
            className="btn btn-icon btn-secondary btn-sm"
            style={{ borderRadius: '50%' }}
            aria-label={isExpanded ? 'Collapse Studio' : 'Expand Studio'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Studio Expanded Body */}
      {isExpanded && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Controls Deck: Target Team Size & Group Naming Format */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '1rem',
              alignItems: 'stretch'
            }}
          >
            {/* Tile 1: Target Size with Steppers & Quick Presets */}
            <div 
              style={{
                backgroundColor: 'var(--bg-app)',
                padding: '1.05rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                  <Users size={16} className="text-teal" /> Target Team Size
                </label>
                <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 800 }}>
                  {numTeams} {numTeams === 1 ? 'Team' : 'Teams'} planned
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Stepper Input */}
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <button
                    type="button"
                    onClick={() => setTargetSize(prev => Math.max(2, prev - 1))}
                    disabled={targetSize <= 2}
                    style={{
                      width: '34px',
                      height: '34px',
                      border: 'none',
                      background: 'transparent',
                      color: targetSize <= 2 ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: targetSize <= 2 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      transition: 'background 0.15s'
                    }}
                    title="Decrease team size"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min={2} 
                    max={Math.max(2, totalMembers)}
                    value={targetSize}
                    onChange={(e) => setTargetSize(Math.max(2, Number(e.target.value)))}
                    style={{ 
                      fontWeight: 800, 
                      textAlign: 'center', 
                      height: '34px', 
                      width: '46px', 
                      border: 'none', 
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setTargetSize(prev => Math.min(Math.max(2, totalMembers), prev + 1))}
                    disabled={targetSize >= totalMembers}
                    style={{
                      width: '34px',
                      height: '34px',
                      border: 'none',
                      background: 'transparent',
                      color: targetSize >= totalMembers ? 'var(--text-muted)' : 'var(--text-primary)',
                      cursor: targetSize >= totalMembers ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      transition: 'background 0.15s'
                    }}
                    title="Increase team size"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Preset:</span>
                  {[2, 3, 4, 5, 6, 8].map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTargetSize(size)}
                      className={`btn btn-sm ${targetSize === size ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.74rem',
                        fontWeight: targetSize === size ? 800 : 600,
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: '6px'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                Distributing {totalMembers} students into {numTeams} teams (~{targetSize} members per team)
              </div>
            </div>

            {/* Tile 2: Team Prefix & Group Naming Format */}
            <div 
              style={{
                backgroundColor: 'var(--bg-app)',
                padding: '1.05rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                  <Layers size={16} className="text-teal" /> Group Naming Format
                </label>
                <span style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--primary)', 
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-light)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px'
                }}>
                  Preview: {effectivePrefix} 1, {effectivePrefix} 2...
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <CustomSelect
                    options={PREFIX_OPTIONS}
                    value={prefix}
                    onChange={(val) => setPrefix(val)}
                  />
                </div>
                {prefix === 'custom' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Pod, Squad, Lab..."
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    style={{ height: '38px', fontSize: '0.82rem', fontWeight: 600, width: '130px' }}
                  />
                )}
              </div>

              <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                Generated teams will be sequentially numbered with this naming prefix
              </div>
            </div>
          </div>

          {/* ── CUSTOM RULES & CONSTRAINTS STUDIO CARD (CONTRACTABLE) ───────────────────── */}
          <div 
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)', 
              padding: isRulesExpanded ? '1.25rem' : '0.85rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: isRulesExpanded ? '1rem' : '0.45rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Rules Header with Utilities & Collapse Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div 
                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                title={isRulesExpanded ? 'Click to collapse rules' : 'Click to expand rules'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Settings2 size={16} className="text-teal" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Active Custom Grouping Rules &amp; Weightages
                  </span>
                  <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                    {activeRules.length} Active / {rules.length} Total
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                {isRulesExpanded && (
                  <>
                    {/* Simplified vs Precise Mode Switcher */}
                    <div className="autogroup-weight-mode-switch" title="Toggle between simplified 1-click priority tiers and precise numeric sliders">
                      <button
                        type="button"
                        className={`autogroup-weight-mode-btn ${weightControlMode === 'simplified' ? 'active' : ''}`}
                        onClick={() => handleSetWeightControlMode('simplified')}
                      >
                        <Sparkles size={11} /> Simplified
                      </button>
                      <button
                        type="button"
                        className={`autogroup-weight-mode-btn ${weightControlMode === 'precise' ? 'active' : ''}`}
                        onClick={() => handleSetWeightControlMode('precise')}
                      >
                        <Sliders size={11} /> Precise Sliders
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleResetToDefaults}
                      title="Reset to recommended balanced rules"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                    >
                      <RotateCcw size={12} /> Reset Defaults
                    </button>
                    {rules.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleClearAllRules}
                        title="Clear all rules"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: 'var(--text-muted)' }}
                      >
                        Clear All
                      </button>
                    )}
                  </>
                )}

                {/* Contract / Expand Button */}
                <button
                  type="button"
                  onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: isRulesExpanded ? 'transparent' : 'var(--primary-light)',
                    color: isRulesExpanded ? 'var(--text-secondary)' : 'var(--primary)',
                    borderColor: isRulesExpanded ? 'var(--border-color)' : 'var(--primary)'
                  }}
                  title={isRulesExpanded ? 'Hide rules section to optimize screen space' : 'Show and configure grouping rules'}
                >
                  {isRulesExpanded ? (
                    <>
                      <ChevronUp size={14} /> Hide Rules
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Show Rules ({activeRules.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsed Compact Summary Preview Strip */}
            {!isRulesExpanded && (
              <div 
                onClick={() => setIsRulesExpanded(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.45rem 0.75rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {activeRules.map((rule, idx) => {
                    const color = RULE_PALETTE[idx % RULE_PALETTE.length];
                    const pct = totalActiveWeight > 0 ? Math.round((rule.weight / totalActiveWeight) * 100) : 0;
                    return (
                      <span 
                        key={rule.id} 
                        style={{ 
                          fontSize: '0.71rem', 
                          fontWeight: 600, 
                          color: 'var(--text-primary)', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.3rem',
                          backgroundColor: 'var(--bg-surface)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
                        {rule.name} ({pct}%)
                      </span>
                    );
                  })}
                  {activeRules.length === 0 && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      No active rules configured (random distribution)
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-teal)', fontWeight: 700 }}>
                  Click to expand & edit &rarr;
                </span>
              </div>
            )}

            {/* Expanded Rules Content */}
            {isRulesExpanded && (
              <>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '-0.35rem 0 0 0' }}>
                  Each enabled rule contributes proportionally to the multi-objective optimization function. Adjust sliders to fine-tune prioritization.
                </p>

                {/* Proportional Weight Breakdown Bar */}
                {activeRules.length > 0 && totalActiveWeight > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        Overall Optimization Weight Distribution
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {activeRules.length} active criteria balancing 100% of cohort formation
                      </span>
                    </div>
                    <div className="autogroup-weight-bar-container">
                      {activeRules.map((rule, idx) => {
                        const pct = Math.round((rule.weight / totalActiveWeight) * 100);
                        const color = RULE_PALETTE[idx % RULE_PALETTE.length];
                        return (
                          <div
                            key={rule.id}
                            className="autogroup-weight-bar-segment"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                            title={`${rule.name}: ${pct}% of total grouping focus`}
                          />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '0.1rem' }}>
                      {activeRules.map((rule, idx) => {
                        const pct = Math.round((rule.weight / totalActiveWeight) * 100);
                        const color = RULE_PALETTE[idx % RULE_PALETTE.length];
                        return (
                          <div key={rule.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rule.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}



            {/* Quick-Add Discovered Cohort Attributes Strip */}
            {discoveredFields.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', padding: '0.4rem 0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Compass size={12} style={{ color: 'var(--primary)' }} /> Discovered in Roster:
                </span>
                {discoveredFields.map(df => {
                  const alreadyConfigured = rules.some(r => r.fieldKey === df.key);
                  if (alreadyConfigured) return null;
                  return (
                    <button
                      key={df.key}
                      type="button"
                      className="autogroup-discovered-chip"
                      onClick={() => handleQuickAddDiscoveredField(df)}
                      title={`Add rule for ${df.name} (${df.distinctCount} unique values across ${df.count} students)`}
                    >
                      <Plus size={11} style={{ color: 'var(--primary)' }} />
                      <span>{df.name}</span>
                      <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>({df.distinctCount} vals)</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Rules List */}
            <div className="autogroup-rules-container">
              {rules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 0.4rem auto', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No grouping rules configured. Students will be partitioned randomly in equal sizes.</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetToDefaults} style={{ marginTop: '0.6rem' }}>
                    <RotateCcw size={12} /> Load Recommended Rules
                  </button>
                </div>
              ) : (
                rules.map((rule, idx) => {
                  const relativePct = totalActiveWeight > 0 && rule.enabled ? Math.round((rule.weight / totalActiveWeight) * 100) : 0;
                  const ruleColor = RULE_PALETTE[idx % RULE_PALETTE.length];

                  return (
                    <div 
                      key={rule.id} 
                      className={`autogroup-rule-card ${!rule.enabled ? 'disabled' : ''}`}
                    >
                      <div className="autogroup-rule-row-grid">
                        
                        {/* Col 1: Toggle + Icon + Title + Attribute Pill + Description (Full wrapping) */}
                        <div className="autogroup-rule-title-group">
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => handleToggleRule(rule.id)}
                              style={{ width: '16px', height: '16px', accentColor: ruleColor, cursor: 'pointer' }}
                            />
                          </label>

                          <div className="autogroup-rule-icon-box" style={{ backgroundColor: `${ruleColor}18`, color: ruleColor }}>
                            {getRuleIcon(rule.fieldKey)}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: rule.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {rule.name}
                              </span>
                              <span className="badge badge-secondary" style={{ fontSize: '0.66rem', padding: '0.1rem 0.4rem' }}>
                                Attribute: {rule.fieldKey}
                              </span>
                            </div>
                            {rule.description && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.35, marginTop: '0.15rem' }}>
                                {rule.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Mode Pill Selector */}
                        <div className="autogroup-mode-pill-group">
                          <button
                            type="button"
                            onClick={() => handleModeChange(rule.id, 'disperse')}
                            className={`autogroup-mode-pill ${rule.mode === 'disperse' ? 'active' : ''}`}
                            title="Disperse: Spread matching values across different teams"
                            disabled={!rule.enabled}
                          >
                            <Globe size={11} /> Disperse
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeChange(rule.id, 'cluster')}
                            className={`autogroup-mode-pill ${rule.mode === 'cluster' ? 'active' : ''}`}
                            title="Cluster: Group students with identical values into the same team"
                            disabled={!rule.enabled}
                          >
                            <Users size={11} /> Cluster
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeChange(rule.id, 'balance')}
                            className={`autogroup-mode-pill ${rule.mode === 'balance' ? 'active' : ''}`}
                            title="Balance: Equal numerical averages or balanced representation"
                            disabled={!rule.enabled}
                          >
                            <Layers size={11} /> Balance
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeChange(rule.id, 'strict_disperse')}
                            className={`autogroup-mode-pill ${rule.mode === 'strict_disperse' ? 'active' : ''}`}
                            title="Strict: Heavy penalty if identical attributes are paired"
                            disabled={!rule.enabled}
                          >
                            <ShieldAlert size={11} /> Strict
                          </button>
                        </div>

                        {/* Col 3: Simplified Priority Tiers vs Precise Slider */}
                        {weightControlMode === 'simplified' ? (
                          <div className="autogroup-priority-control-group">
                            <div className="autogroup-priority-tier-buttons">
                              <button
                                type="button"
                                onClick={() => handleWeightChange(rule.id, 10)}
                                className={`autogroup-priority-btn ${rule.weight <= 12 ? 'active' : ''}`}
                                disabled={!rule.enabled}
                                title="Low priority (10 pts) - gentle influence"
                              >
                                Low
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWeightChange(rule.id, 20)}
                                className={`autogroup-priority-btn ${rule.weight > 12 && rule.weight <= 25 ? 'active' : ''}`}
                                disabled={!rule.enabled}
                                title="Medium priority (20 pts) - standard balanced influence"
                              >
                                Medium
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWeightChange(rule.id, 35)}
                                className={`autogroup-priority-btn ${rule.weight > 25 && rule.weight < 45 ? 'active' : ''}`}
                                disabled={!rule.enabled}
                                title="High priority (35 pts) - strong grouping preference"
                              >
                                High
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWeightChange(rule.id, 50)}
                                className={`autogroup-priority-btn ${rule.weight >= 45 ? 'active' : ''}`}
                                disabled={!rule.enabled}
                                title="Critical priority (50 pts) - top priority constraint"
                              >
                                Critical
                              </button>
                            </div>

                            <div 
                              className="autogroup-priority-share-badge" 
                              style={{ 
                                borderColor: rule.enabled ? `${ruleColor}40` : 'var(--border-color)',
                                backgroundColor: rule.enabled ? `${ruleColor}10` : 'var(--bg-app)'
                              }}
                              title={`${rule.name} accounts for ${rule.enabled ? relativePct : 0}% of the overall optimization weight`}
                            >
                              <span 
                                className="autogroup-priority-share-dot" 
                                style={{ backgroundColor: rule.enabled ? ruleColor : 'var(--text-muted)' }} 
                              />
                              <span style={{ fontWeight: 800, color: rule.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {rule.enabled ? `${relativePct}% Share` : '0%'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="autogroup-precise-slider-wrapper">
                            <div className="autogroup-slider-track-wrap">
                              <button 
                                type="button" 
                                className="autogroup-stepper-btn" 
                                onClick={() => handleWeightChange(rule.id, Math.max(1, rule.weight - 1))}
                                disabled={!rule.enabled || rule.weight <= 1}
                                title="Decrease weight by 1"
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min={1}
                                max={50}
                                value={rule.weight}
                                onChange={(e) => handleWeightChange(rule.id, Number(e.target.value))}
                                disabled={!rule.enabled}
                                className="autogroup-slider-input"
                                style={{ '--thumb-color': ruleColor } as React.CSSProperties}
                                title={`Weight: ${rule.weight} pts`}
                              />
                              <button 
                                type="button" 
                                className="autogroup-stepper-btn" 
                                onClick={() => handleWeightChange(rule.id, Math.min(50, rule.weight + 1))}
                                disabled={!rule.enabled || rule.weight >= 50}
                                title="Increase weight by 1"
                              >
                                +
                              </button>
                              <span className="autogroup-weight-num-badge" style={{ color: rule.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {rule.weight} pts
                              </span>
                            </div>

                            <div 
                              className="autogroup-priority-share-badge" 
                              style={{ 
                                borderColor: rule.enabled ? `${ruleColor}40` : 'var(--border-color)',
                                backgroundColor: rule.enabled ? `${ruleColor}10` : 'var(--bg-app)'
                              }}
                              title={`${rule.name} accounts for ${rule.enabled ? relativePct : 0}% of the overall optimization weight`}
                            >
                              <span 
                                className="autogroup-priority-share-dot" 
                                style={{ backgroundColor: rule.enabled ? ruleColor : 'var(--text-muted)' }} 
                              />
                              <span style={{ fontWeight: 800, color: rule.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                {rule.enabled ? `${relativePct}% Share` : '0%'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Col 4: Delete Action */}
                        <div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px' }}
                            title="Remove this rule"
                          >
                            <Trash2 size={15} className="hover:text-red-500" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

          {/* ── TEAMS PREVIEW TOOLBAR & LAYOUT SWITCHER ─────────────────────────────── */}
          {students.length > 0 && groupingResult && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '0.85rem',
                padding: '0.85rem 1.15rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Layout Switcher Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <LayoutGrid size={14} className="text-teal" /> Preview Layout:
                </span>
                <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                  >
                    <LayoutGrid size={13} /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                  >
                    <Kanban size={13} /> Kanban Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                  >
                    <Table size={13} /> Detailed Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('compact')}
                    className={`btn btn-sm ${viewMode === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                  >
                    <Columns3 size={13} /> Compact Matrix
                  </button>
                </div>
              </div>

              {/* History & Pin Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="btn btn-sm btn-secondary"
                    title="Undo team move (Ctrl+Z)"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      opacity: historyIndex <= 0 ? 0.45 : 1,
                      cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Undo2 size={13} /> Undo
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="btn btn-sm btn-secondary"
                    title="Redo team move (Ctrl+Y)"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      opacity: historyIndex >= history.length - 1 ? 0.45 : 1,
                      cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Redo2 size={13} /> Redo
                  </button>
                </div>

                {pinnedStudentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleUnpinAll}
                    className="btn btn-sm btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.32rem 0.65rem',
                      fontSize: '0.74rem',
                      borderRadius: '6px',
                      color: 'var(--accent-amber)',
                      fontWeight: 700
                    }}
                    title="Unlock all pinned students"
                  >
                    <PinOff size={13} /> Unpin All ({pinnedStudentIds.size})
                  </button>
                )}
              </div>

              {/* Search Filter Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px', flex: '1 1 240px', maxWidth: '340px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Filter students, university, nationality..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{ height: '36px', paddingLeft: '32px', paddingRight: searchFilter ? '30px' : '10px', fontSize: '0.8rem', width: '100%' }}
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TEAMS PREVIEW RENDERING ─────────────────────────────────────────── */}
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <Users size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>No Students in Class Roster</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 1rem 0' }}>
                Import students via Section 1 Onboarding Wizard or load a 100-student demo dataset to test rule optimization.
              </p>
              {onLoadSampleStudents && (
                <button type="button" className="btn btn-primary btn-sm" onClick={onLoadSampleStudents} style={{ fontWeight: 700 }}>
                  <Sparkles size={13} /> Load 100-Student Demo Dataset
                </button>
              )}
            </div>
          ) : groupingResult && (
            <div className={draggedStudentId ? 'is-dragging-student' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Sticky All-Teams Quick Drop Target Strip (Sticky across Grid, Kanban, Table & Compact views) */}
              <div 
                className="autogroup-sticky-quick-bar"
                style={{ 
                  position: 'sticky',
                  top: '60px',
                  zIndex: 960,
                  padding: '0.65rem 0.85rem', 
                  backgroundColor: 'var(--bg-surface)', 
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: 'var(--radius-md)', 
                  border: draggedStudentId ? '1.5px dashed var(--accent-teal)' : '1px solid var(--border-color)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: draggedStudentId ? 'var(--accent-teal)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {draggedStudentId ? <Zap size={13} className="text-teal" /> : <Target size={13} className="text-teal" />}
                    {draggedStudentId ? 'Drop card onto any team below for instant move:' : 'Quick Team Drop & Jump Targets:'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Layers size={11} /> {groupingResult.groups.length} Targets Available
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '110px', overflowY: 'auto' }}>
                  {groupingResult.groups.map(g => {
                    const isTargetHovered = dragOverGroupId === `quick-${g.groupName}`;
                    return (
                      <div
                        key={`quick-drop-${g.groupName}`}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedStudentId && dragOverGroupId !== `quick-${g.groupName}`) {
                            setDragOverGroupId(`quick-${g.groupName}`);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          if (draggedStudentId && dragOverGroupId !== `quick-${g.groupName}`) {
                            setDragOverGroupId(`quick-${g.groupName}`);
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverGroupId === `quick-${g.groupName}`) {
                              setDragOverGroupId(null);
                            }
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                          if (studentId) {
                            handleMoveStudent(studentId, g.groupName);
                          }
                          setDraggedStudentId(null);
                          setDragOverGroupId(null);
                        }}
                        onClick={() => {
                          const el = document.getElementById(`grid-team-card-${g.groupName}`) || document.getElementById(`kanban-team-col-${g.groupName}`) || document.getElementById(`table-team-section-${g.groupName}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.22rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: isTargetHovered 
                            ? 'var(--accent-teal)' 
                            : draggedStudentId 
                              ? 'rgba(13, 148, 136, 0.08)' 
                              : 'var(--bg-app)',
                          color: isTargetHovered ? '#ffffff' : 'var(--text-primary)',
                          border: isTargetHovered 
                            ? '1px solid var(--accent-teal)' 
                            : draggedStudentId 
                              ? '1px dashed var(--accent-teal)' 
                              : '1px solid var(--border-color)',
                          boxShadow: isTargetHovered ? '0 2px 8px rgba(13, 148, 136, 0.35)' : 'none',
                          transform: isTargetHovered ? 'scale(1.04)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                        title={`Click to jump, or drop student here to move to ${g.groupName}`}
                      >
                        <span>{g.groupName}</span>
                        <span style={{ 
                          fontSize: '0.64rem', 
                          padding: '0.05rem 0.3rem', 
                          borderRadius: '4px', 
                          backgroundColor: isTargetHovered ? 'rgba(255,255,255,0.25)' : 'var(--primary-light)', 
                          color: isTargetHovered ? '#ffffff' : 'var(--primary)', 
                          fontWeight: 800 
                        }}>
                          {g.studentCount}
                        </span>
                        {/* What-If Simulation Badge */}
                        {draggedStudentId && simulationReports && simulationReports[g.groupName] && (
                          <span 
                            className={`autogroup-sim-badge ${simulationReports[g.groupName].delta > 0 ? 'positive' : simulationReports[g.groupName].delta < 0 ? 'negative' : 'neutral'}`}
                            style={{
                              fontSize: '0.62rem',
                              padding: '0.04rem 0.28rem',
                              borderRadius: '4px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '1px'
                            }}
                            title={`Simulated score if dropped here: ${simulationReports[g.groupName].simulatedScore}% (${simulationReports[g.groupName].delta > 0 ? '+' : ''}${simulationReports[g.groupName].delta}%)`}
                          >
                            {simulationReports[g.groupName].delta > 0 ? `+${simulationReports[g.groupName].delta}%` : `${simulationReports[g.groupName].delta}%`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1. Enhanced Kanban Board View */}
              {viewMode === 'kanban' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Kanban Sub-Header Controls & Layout Mode Switcher */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    flexWrap: 'wrap', 
                    gap: '0.65rem',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Kanban size={14} className="text-teal" /> Kanban View
                      </span>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                        {groupingResult.groups.length} Teams • {groupingResult.updatedStudents.length} Students
                      </span>
                    </div>

                    {/* Board Layout Mode Switcher */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--bg-surface)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => setKanbanLayout('wrap')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: kanbanLayout === 'wrap' ? 700 : 500,
                          cursor: 'pointer',
                          backgroundColor: kanbanLayout === 'wrap' ? 'var(--accent-teal)' : 'transparent',
                          color: kanbanLayout === 'wrap' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.15s'
                        }}
                        title="Fit and wrap all teams on screen in responsive multi-column grid"
                      >
                        <LayoutGrid size={12} /> Wrap All Teams
                      </button>
                      <button
                        type="button"
                        onClick={() => setKanbanLayout('compact')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: kanbanLayout === 'compact' ? 700 : 500,
                          cursor: 'pointer',
                          backgroundColor: kanbanLayout === 'compact' ? 'var(--accent-teal)' : 'transparent',
                          color: kanbanLayout === 'compact' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.15s'
                        }}
                        title="High density compact view to see maximum teams simultaneously"
                      >
                        <Columns3 size={12} /> Compact Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setKanbanLayout('scroll')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: kanbanLayout === 'scroll' ? 700 : 500,
                          cursor: 'pointer',
                          backgroundColor: kanbanLayout === 'scroll' ? 'var(--accent-teal)' : 'transparent',
                          color: kanbanLayout === 'scroll' ? '#ffffff' : 'var(--text-secondary)',
                          transition: 'all 0.15s'
                        }}
                        title="Classic horizontal scrollable swimlanes"
                      >
                        <Kanban size={12} /> Horizontal Scroll
                      </button>
                    </div>
                  </div>

                  {/* Kanban Columns Grid / Flex Container */}
                  <div 
                    style={
                      kanbanLayout === 'wrap'
                        ? {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '0.85rem',
                            alignItems: 'start'
                          }
                        : kanbanLayout === 'compact'
                        ? {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
                            gap: '0.65rem',
                            alignItems: 'start'
                          }
                        : {
                            display: 'flex',
                            gap: '1rem',
                            overflowX: 'auto',
                            paddingBottom: '0.85rem'
                          }
                    }
                  >
                    {groupingResult.groups.map(group => {
                      const filteredMembers = group.students.filter(s => 
                        !searchFilter.trim() || 
                        s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                        (s.nationality && s.nationality.toLowerCase().includes(searchFilter.toLowerCase())) ||
                        (s.university && s.university.toLowerCase().includes(searchFilter.toLowerCase())) ||
                        (s.gender && s.gender.toLowerCase().includes(searchFilter.toLowerCase())) ||
                        (s.englishProficiency && s.englishProficiency.toLowerCase().includes(searchFilter.toLowerCase()))
                      );
                      const isDragOver = dragOverGroupId === group.groupName;
                      const pinnedInGroup = group.students.filter(s => pinnedStudentIds.has(s.id)).length;
                      const sim = simulationReports ? simulationReports[group.groupName] : null;

                      return (
                        <div
                          id={`kanban-team-col-${group.groupName}`}
                          key={group.groupName}
                          className={`autogroup-kanban-col ${isDragOver ? 'drag-over' : ''}`}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedStudentId && dragOverGroupId !== group.groupName) {
                              setDragOverGroupId(group.groupName);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                            if (draggedStudentId && dragOverGroupId !== group.groupName) {
                              setDragOverGroupId(group.groupName);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              if (dragOverGroupId === group.groupName) {
                                setDragOverGroupId(null);
                              }
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                            if (studentId) {
                              handleMoveStudent(studentId, group.groupName);
                            }
                            setDraggedStudentId(null);
                            setDragOverGroupId(null);
                          }}
                          style={{
                            minWidth: kanbanLayout === 'scroll' ? '275px' : 'auto',
                            maxWidth: kanbanLayout === 'scroll' ? '290px' : 'none',
                            flexShrink: kanbanLayout === 'scroll' ? 0 : 1,
                            backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-app)',
                            border: isDragOver ? '2px dashed var(--accent-teal)' : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: isDragOver ? '0 0 0 3px rgba(13, 148, 136, 0.15)' : 'none',
                            transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s'
                          }}
                        >
                          {/* Column Header */}
                          <div style={{ 
                            padding: kanbanLayout === 'compact' ? '0.5rem 0.65rem' : '0.75rem 0.9rem', 
                            backgroundColor: 'var(--bg-surface)', 
                            borderBottom: '1px solid var(--border-color)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <div>
                              <span style={{ fontSize: kanbanLayout === 'compact' ? '0.8rem' : '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {group.groupName}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                                {group.studentCount} {group.studentCount === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {pinnedInGroup > 0 && (
                                <span 
                                  className="autogroup-pinned-indicator"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#d97706',
                                    fontWeight: 700
                                  }}
                                  title={`${pinnedInGroup} student${pinnedInGroup > 1 ? 's' : ''} pinned to this team`}
                                >
                                  <Pin size={10} style={{ transform: 'rotate(45deg)' }} /> {pinnedInGroup}
                                </span>
                              )}
                              {sim && sim.delta !== 0 && (
                                <span 
                                  className={`autogroup-sim-badge ${sim.delta > 0 ? 'positive' : 'negative'}`}
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '1px'
                                  }}
                                  title={`Live What-If: moving student here changes diversity to ${sim.simulatedScore}% (${sim.delta > 0 ? '+' : ''}${sim.delta}%)`}
                                >
                                  {sim.delta > 0 ? `+${sim.delta}%` : `${sim.delta}%`}
                                </span>
                              )}
                              <span 
                                style={{ 
                                  fontSize: kanbanLayout === 'compact' ? '0.68rem' : '0.75rem', 
                                  fontWeight: 800, 
                                  backgroundColor: 'var(--primary-light)', 
                                  color: 'var(--primary)', 
                                  padding: '0.12rem 0.4rem', 
                                  borderRadius: '6px' 
                                }}
                              >
                                {group.diversityScore}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setExportModal({ isOpen: true, team: group, format: 'xlsx', scope: 'diversity_card' })}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                                title="Export this team"
                              >
                                <Download size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Student Cards in Column */}
                          <div style={{ 
                            padding: kanbanLayout === 'compact' ? '0.45rem' : '0.65rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: kanbanLayout === 'compact' ? '0.35rem' : '0.5rem', 
                            minHeight: '110px', 
                            flex: 1 
                          }}>
                            {filteredMembers.length === 0 ? (
                              <div style={{ padding: '1rem 0.4rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                {group.students.length === 0 ? 'Drop student here to assign' : 'No matching students'}
                              </div>
                            ) : (
                              filteredMembers.map(student => {
                                const isPinned = pinnedStudentIds.has(student.id);
                                const isDraggingThis = draggedStudentId === student.id;

                                return (
                                <div
                                  key={student.id}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', student.id);
                                    setDraggedStudentId(student.id);
                                  }}
                                  onDragEnd={(e) => {
                                    e.preventDefault();
                                    setDraggedStudentId(null);
                                    setDragOverGroupId(null);
                                  }}
                                  onClick={() => setSelectedStudent(student)}
                                  className={`autogroup-kanban-card ${isDraggingThis ? 'is-being-dragged' : ''}`}
                                  style={{
                                    padding: kanbanLayout === 'compact' ? '0.45rem 0.55rem' : '0.6rem 0.7rem',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: isPinned ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    cursor: 'grab',
                                    boxShadow: isPinned ? '0 1px 4px rgba(245, 158, 11, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: kanbanLayout === 'compact' ? '0.25rem' : '0.35rem',
                                    transition: 'transform 0.12s, box-shadow 0.12s',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                                      <div style={{ 
                                        width: kanbanLayout === 'compact' ? '19px' : '22px', 
                                        height: kanbanLayout === 'compact' ? '19px' : '22px', 
                                        borderRadius: '50%', 
                                        backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.15)' : 'var(--primary-light)', 
                                        color: isPinned ? '#d97706' : 'var(--primary)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: kanbanLayout === 'compact' ? '0.62rem' : '0.68rem', 
                                        fontWeight: 800, 
                                        flexShrink: 0 
                                      }}>
                                        {student.name.charAt(0)}
                                      </div>
                                      <span style={{ 
                                        fontSize: kanbanLayout === 'compact' ? '0.74rem' : '0.8rem', 
                                        fontWeight: 700, 
                                        color: 'var(--text-primary)', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                      }}>
                                        {student.name}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                      {/* Student Pin / Lock Button */}
                                      <button
                                        type="button"
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePin(student.id);
                                        }}
                                        className={`autogroup-pin-btn ${isPinned ? 'pinned' : ''}`}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: '0.15rem',
                                          cursor: 'pointer',
                                          borderRadius: '4px',
                                          color: isPinned ? '#d97706' : 'var(--text-muted)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          transition: 'all 0.15s ease'
                                        }}
                                        title={isPinned ? "Student is locked to this team. Click to unpin." : "Pin student to keep them in this team during re-shuffle / optimization"}
                                      >
                                        <Pin size={12} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                      </button>
                                      <select
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.value) handleMoveStudent(student.id, e.target.value);
                                        }}
                                        value=""
                                        style={{
                                          fontSize: '0.64rem',
                                          padding: '0.08rem 0.15rem',
                                          backgroundColor: 'var(--bg-app)',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '4px',
                                          color: 'var(--text-muted)',
                                          cursor: 'pointer'
                                        }}
                                        title="Quick move to another team"
                                      >
                                        <option value="" disabled>Move...</option>
                                        {groupingResult.groups.filter(g => g.groupName !== group.groupName).map(g => (
                                          <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                                        ))}
                                      </select>
                                      <GripVertical size={12} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                                    {student.nationality && (
                                      <span className="badge badge-secondary" style={{ fontSize: '0.6rem', padding: '0.08rem 0.3rem' }}>
                                        {student.nationality}
                                      </span>
                                    )}
                                    {student.gender && (
                                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{student.gender}</span>
                                    )}
                                    {student.englishProficiency && (
                                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                        • {student.englishProficiency.split(' ')[0]}
                                      </span>
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
                </div>
              ) : viewMode === 'table' ? (
                /* 2. Detailed Table View */
                <div className="autogroup-table-container">
                  <table className="autogroup-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: '160px' }}>Team Name</th>
                        <th style={{ width: '90px' }}>Diversity</th>
                        <th style={{ width: '80px' }}>Members</th>
                        <th>Student Roster</th>
                        <th style={{ width: '180px' }}>Demographics</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Export</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupingResult.groups.map(group => {
                        const filteredMembers = group.students.filter(s => 
                          !searchFilter.trim() || 
                          s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          (s.nationality && s.nationality.toLowerCase().includes(searchFilter.toLowerCase())) ||
                          (s.university && s.university.toLowerCase().includes(searchFilter.toLowerCase()))
                        );

                        const natList = Array.from(new Set(group.students.map(s => s.nationality).filter(Boolean)));
                        const genderCounts = group.students.reduce((acc, s) => {
                          const g = s.gender || 'Other';
                          acc[g] = (acc[g] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        const pinnedInGroup = group.students.filter(s => pinnedStudentIds.has(s.id)).length;
                        const isDragOver = dragOverGroupId === `table-${group.groupName}`;

                        return (
                          <tr 
                            key={group.groupName}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggedStudentId && dragOverGroupId !== `table-${group.groupName}`) {
                                setDragOverGroupId(`table-${group.groupName}`);
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              if (draggedStudentId && dragOverGroupId !== `table-${group.groupName}`) {
                                setDragOverGroupId(`table-${group.groupName}`);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                if (dragOverGroupId === `table-${group.groupName}`) {
                                  setDragOverGroupId(null);
                                }
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                              if (studentId) {
                                handleMoveStudent(studentId, group.groupName);
                              }
                              setDraggedStudentId(null);
                              setDragOverGroupId(null);
                            }}
                            style={{
                              backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.08)' : undefined,
                              outline: isDragOver ? '2px dashed var(--accent-teal)' : undefined
                            }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                  {group.groupName}
                                </span>
                                {pinnedInGroup > 0 && (
                                  <span 
                                    className="autogroup-pinned-indicator"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.62rem',
                                      padding: '0.08rem 0.3rem',
                                      borderRadius: '4px',
                                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                      color: '#d97706',
                                      fontWeight: 700
                                    }}
                                    title={`${pinnedInGroup} student${pinnedInGroup > 1 ? 's' : ''} pinned to this team`}
                                  >
                                    <Pin size={9} style={{ transform: 'rotate(45deg)' }} /> {pinnedInGroup}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span 
                                style={{ 
                                  fontSize: '0.76rem', 
                                  fontWeight: 800, 
                                  backgroundColor: 'var(--primary-light)', 
                                  color: 'var(--primary)', 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '6px',
                                  display: 'inline-block'
                                }}
                              >
                                {group.diversityScore}%
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                                {group.studentCount}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {filteredMembers.map(student => {
                                  const isPinned = pinnedStudentIds.has(student.id);
                                  const isDraggingThis = draggedStudentId === student.id;

                                  return (
                                    <div
                                      key={student.id}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData('text/plain', student.id);
                                        setDraggedStudentId(student.id);
                                      }}
                                      onDragEnd={(e) => {
                                        e.preventDefault();
                                        setDraggedStudentId(null);
                                        setDragOverGroupId(null);
                                      }}
                                      className={`autogroup-draggable-item ${isDraggingThis ? 'is-being-dragged' : ''}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.2rem 0.5rem',
                                        backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-app)',
                                        border: isPinned ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        color: 'var(--text-primary)',
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none'
                                      }}
                                    >
                                      <button
                                        type="button"
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => setSelectedStudent(student)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          cursor: 'pointer',
                                          color: 'inherit'
                                        }}
                                        title="Click to view student profile"
                                      >
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.2)' : 'var(--primary-light)', color: isPinned ? '#d97706' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800 }}>
                                          {student.name.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{student.name}</span>
                                        {student.nationality && (
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({student.nationality})</span>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePin(student.id);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: '0.1rem',
                                          cursor: 'pointer',
                                          color: isPinned ? '#d97706' : 'var(--text-muted)',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                        title={isPinned ? "Student locked in team. Click to unlock." : "Pin student to lock in this team"}
                                      >
                                        <Pin size={11} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {natList.length > 0 && (
                                  <span><strong>Nations:</strong> {natList.slice(0, 3).join(', ')}{natList.length > 3 ? '...' : ''}</span>
                                )}
                                <span>
                                  <strong>Gender:</strong> {Object.entries(genderCounts).map(([k, v]) => `${k[0]}:${v}`).join(', ')}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setExportModal({ isOpen: true, team: group, format: 'xlsx', scope: 'diversity_card' })}
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                title="Export team spreadsheet"
                              >
                                <Download size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : viewMode === 'compact' ? (
                /* 3. Compact Matrix View */
                <div className="autogroup-compact-grid">
                  {groupingResult.groups.map(group => {
                    const filteredMembers = group.students.filter(s => 
                      !searchFilter.trim() || 
                      s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                      (s.nationality && s.nationality.toLowerCase().includes(searchFilter.toLowerCase())) ||
                      (s.university && s.university.toLowerCase().includes(searchFilter.toLowerCase()))
                    );
                    const pinnedInGroup = group.students.filter(s => pinnedStudentIds.has(s.id)).length;
                    const isDragOver = dragOverGroupId === `compact-${group.groupName}`;

                    return (
                      <div
                        key={group.groupName}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedStudentId && dragOverGroupId !== `compact-${group.groupName}`) {
                            setDragOverGroupId(`compact-${group.groupName}`);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          if (draggedStudentId && dragOverGroupId !== `compact-${group.groupName}`) {
                            setDragOverGroupId(`compact-${group.groupName}`);
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverGroupId === `compact-${group.groupName}`) {
                              setDragOverGroupId(null);
                            }
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                          if (studentId) {
                            handleMoveStudent(studentId, group.groupName);
                          }
                          setDraggedStudentId(null);
                          setDragOverGroupId(null);
                        }}
                        style={{
                          backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-surface)',
                          border: isDragOver ? '2px dashed var(--accent-teal)' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          boxShadow: isDragOver ? '0 0 0 3px rgba(13, 148, 136, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {group.groupName}
                            </span>
                            {pinnedInGroup > 0 && (
                              <span 
                                className="autogroup-pinned-indicator"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.62rem',
                                  padding: '0.08rem 0.3rem',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                  color: '#d97706',
                                  fontWeight: 700
                                }}
                                title={`${pinnedInGroup} student${pinnedInGroup > 1 ? 's' : ''} pinned`}
                              >
                                <Pin size={9} style={{ transform: 'rotate(45deg)' }} /> {pinnedInGroup}
                              </span>
                            )}
                          </div>
                          <span 
                            style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 800, 
                              backgroundColor: 'var(--primary-light)', 
                              color: 'var(--primary)', 
                              padding: '0.12rem 0.45rem', 
                              borderRadius: '5px' 
                            }}
                          >
                            {group.diversityScore}%
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {filteredMembers.map(student => {
                            const isPinned = pinnedStudentIds.has(student.id);
                            const isDraggingThis = draggedStudentId === student.id;

                            return (
                            <div
                              key={student.id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', student.id);
                                setDraggedStudentId(student.id);
                              }}
                              onDragEnd={(e) => {
                                e.preventDefault();
                                setDraggedStudentId(null);
                                setDragOverGroupId(null);
                              }}
                              onClick={() => setSelectedStudent(student)}
                              className={`autogroup-draggable-item ${isDraggingThis ? 'is-being-dragged' : ''}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.25rem 0.4rem',
                                backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-app)',
                                border: isPinned ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                cursor: 'grab',
                                userSelect: 'none',
                                WebkitUserSelect: 'none'
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {student.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {student.nationality || student.gender || ''}
                                </span>
                                <button
                                  type="button"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePin(student.id);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0.1rem',
                                    cursor: 'pointer',
                                    color: isPinned ? '#d97706' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title={isPinned ? "Student locked. Click to unlock." : "Pin student"}
                                >
                                  <Pin size={10} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                </button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 4. Enhanced Grid View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.15rem' }}>
                  {groupingResult.groups.map(group => {
                    const filteredMembers = group.students.filter(s => 
                      !searchFilter.trim() || 
                      s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                      (s.nationality && s.nationality.toLowerCase().includes(searchFilter.toLowerCase())) ||
                      (s.university && s.university.toLowerCase().includes(searchFilter.toLowerCase())) ||
                      (s.gender && s.gender.toLowerCase().includes(searchFilter.toLowerCase())) ||
                      (s.englishProficiency && s.englishProficiency.toLowerCase().includes(searchFilter.toLowerCase()))
                    );
                    const pinnedInGroup = group.students.filter(s => pinnedStudentIds.has(s.id)).length;
                    const sim = simulationReports ? simulationReports[group.groupName] : null;
                    const isDragOver = dragOverGroupId === `grid-${group.groupName}`;

                    return (
                      <div
                        id={`grid-team-card-${group.groupName}`}
                        key={group.groupName}
                        className={`autogroup-grid-card ${isDragOver ? 'drag-over' : ''}`}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (draggedStudentId && dragOverGroupId !== `grid-${group.groupName}`) {
                            setDragOverGroupId(`grid-${group.groupName}`);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          if (draggedStudentId && dragOverGroupId !== `grid-${group.groupName}`) {
                            setDragOverGroupId(`grid-${group.groupName}`);
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverGroupId === `grid-${group.groupName}`) {
                              setDragOverGroupId(null);
                            }
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                          if (studentId) {
                            handleMoveStudent(studentId, group.groupName);
                          }
                          setDraggedStudentId(null);
                          setDragOverGroupId(null);
                        }}
                        style={{
                          backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-surface)',
                          border: isDragOver ? '2px dashed var(--accent-teal)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem',
                          boxShadow: isDragOver ? '0 0 0 4px rgba(13, 148, 136, 0.18)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Group Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <div 
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--primary-light)',
                                  color: 'var(--primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.72rem',
                                  fontWeight: 800
                                }}
                              >
                                <Users size={13} />
                              </div>
                              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {group.groupName}
                              </span>
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.12rem 0.4rem' }}>
                                {group.studentCount} {group.studentCount === 1 ? 'member' : 'members'}
                              </span>
                              {pinnedInGroup > 0 && (
                                <span 
                                  className="autogroup-pinned-indicator"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    fontSize: '0.65rem',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                    color: '#d97706',
                                    fontWeight: 700
                                  }}
                                  title={`${pinnedInGroup} student${pinnedInGroup > 1 ? 's' : ''} locked to this team`}
                                >
                                  <Pin size={10} style={{ transform: 'rotate(45deg)' }} /> {pinnedInGroup}
                                </span>
                              )}
                            </div>

                            {/* Rule Satisfactions Mini-Tags */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                              {group.ruleSatisfactions && group.ruleSatisfactions.slice(0, 3).map(rs => (
                                <span 
                                  key={rs.ruleId} 
                                  style={{ 
                                    fontSize: '0.67rem', 
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'var(--bg-app)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)' 
                                  }}
                                >
                                  {rs.ruleName.split(' ')[0]}: <strong style={{ color: rs.satisfactionScore >= 80 ? '#10b981' : 'var(--primary)' }}>{rs.satisfactionScore}%</strong>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            {sim && sim.delta !== 0 && (
                              <span 
                                className={`autogroup-sim-badge ${sim.delta > 0 ? 'positive' : 'negative'}`}
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '1px'
                                }}
                                title={`Live What-If: moving selected student here gives ${sim.simulatedScore}% diversity (${sim.delta > 0 ? '+' : ''}${sim.delta}%)`}
                              >
                                {sim.delta > 0 ? `+${sim.delta}%` : `${sim.delta}%`}
                              </span>
                            )}
                            <span 
                              style={{ 
                                fontSize: '0.82rem', 
                                fontWeight: 800, 
                                color: group.diversityScore >= 80 ? '#0d9488' : 'var(--primary)',
                                backgroundColor: 'var(--primary-light)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)'
                              }}
                              title={`Team overall diversity score: ${group.diversityScore}%`}
                            >
                              {group.diversityScore}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setExportModal({ isOpen: true, team: group, format: 'xlsx', scope: 'diversity_card' })}
                              className="btn btn-sm btn-secondary"
                              style={{ padding: '0.22rem 0.4rem' }}
                              title="Export this team"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Active Drop Cue Banner */}
                        {draggedStudentId && (
                          <div 
                            style={{
                              padding: '0.35rem 0.6rem',
                              borderRadius: '6px',
                              backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.16)' : 'rgba(13, 148, 136, 0.04)',
                              border: isDragOver ? '1.5px solid var(--accent-teal)' : '1px dashed var(--accent-teal)',
                              color: 'var(--accent-teal)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <ArrowRightLeft size={12} /> {isDragOver ? `Release to assign to ${group.groupName}` : `Drop here to move to ${group.groupName}`}
                          </div>
                        )}

                        {/* Members List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                          {filteredMembers.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                              {group.students.length === 0 ? 'Drop students here to assign' : 'No matching students'}
                            </div>
                          ) : (
                            filteredMembers.map(student => {
                              const isPinned = pinnedStudentIds.has(student.id);
                              const isDraggingThis = draggedStudentId === student.id;

                              return (
                                <div
                                  key={student.id}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', student.id);
                                    setDraggedStudentId(student.id);
                                  }}
                                  onDragEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDraggedStudentId(null);
                                    setDragOverGroupId(null);
                                  }}
                                  onClick={() => setSelectedStudent(student)}
                                  className={`autogroup-draggable-item ${isDraggingThis ? 'is-being-dragged' : ''}`}
                                  style={{
                                    padding: '0.5rem 0.65rem',
                                    backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-app)',
                                    border: isPinned ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)',
                                    borderRadius: '7px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.35rem',
                                    fontSize: '0.76rem',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    transition: 'all 0.12s ease'
                                  }}
                                >
                                  {/* Top Row: Grip, Avatar, Name & Uni, Action Controls */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                      <GripVertical size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.6 }} />
                                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.2)' : 'var(--primary-light)', color: isPinned ? '#d97706' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                                        {student.name.charAt(0)}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {student.name}
                                        </span>
                                        {renderStudentUniText(student)}
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                      {/* Quick Move Dropdown */}
                                      <select
                                        value={group.groupName}
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (e.target.value !== group.groupName) {
                                            handleMoveStudent(student.id, e.target.value);
                                          }
                                        }}
                                        style={{
                                          fontSize: '0.67rem',
                                          padding: '0.12rem 0.3rem',
                                          borderRadius: '4px',
                                          border: '1px solid var(--border-color)',
                                          backgroundColor: 'var(--bg-surface)',
                                          color: 'var(--text-secondary)',
                                          cursor: 'pointer',
                                          fontWeight: 600
                                        }}
                                        title="Instantly move student to another team"
                                      >
                                        {groupingResult.groups.map(g => (
                                          <option key={g.groupName} value={g.groupName}>
                                            {g.groupName === group.groupName ? `Team: ${g.groupName}` : `Move to ${g.groupName}`}
                                          </option>
                                        ))}
                                      </select>

                                      {/* Pin Button */}
                                      <button
                                        type="button"
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTogglePin(student.id);
                                        }}
                                        style={{
                                          background: isPinned ? 'rgba(245, 158, 11, 0.15)' : 'none',
                                          border: isPinned ? '1px solid rgba(245, 158, 11, 0.35)' : 'none',
                                          borderRadius: '4px',
                                          padding: '0.18rem',
                                          cursor: 'pointer',
                                          color: isPinned ? '#d97706' : 'var(--text-muted)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        title={isPinned ? "Student is locked. Click to unlock." : "Pin student to lock into this team"}
                                      >
                                        <Pin size={12} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Bottom Row: Demographics Chips */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', paddingLeft: '1.25rem' }}>
                                    {student.nationality && (
                                      <span className="badge badge-secondary" style={{ fontSize: '0.64rem', padding: '0.08rem 0.32rem', fontWeight: 600 }}>
                                        <Globe size={9} style={{ marginRight: '2px' }} /> {student.nationality}
                                      </span>
                                    )}
                                    {student.gender && (
                                      <span className="badge badge-secondary" style={{ fontSize: '0.64rem', padding: '0.08rem 0.32rem' }}>
                                        {student.gender}
                                      </span>
                                    )}
                                    {student.englishProficiency && (
                                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                        <Languages size={9} /> {student.englishProficiency.split(' ')[0]}
                                      </span>
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
            </div>
          )}

          {/* ── BOTTOM ACTION & FINALIZATION BAR ─────────────────────────────────────── */}
          {groupingResult && students.length > 0 && (
            <div className="autogroup-bottom-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                    {groupingResult.groups.length} Teams Configured ({students.length} Students Total)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Simulated Annealing Optimized • Ready to apply allocation to class roster
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowReshuffleModal(true)}
                    disabled={isGenerating || students.length === 0}
                    style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', fontWeight: 700 }}
                    title="Re-run simulated annealing to generate a new mix"
                  >
                    <Shuffle size={14} style={{ color: 'var(--primary)' }} className={isGenerating ? 'spin' : ''} /> Shuffle Combinations
                  </button>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', paddingLeft: '0.2rem' }}>
                    Re-runs optimization for a new mix
                  </span>
                </div>

                {onOpenTeamCharter && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onOpenTeamCharter}
                      style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', fontWeight: 700, borderColor: 'var(--primary)', color: 'var(--primary)', backgroundColor: 'var(--bg-surface)' }}
                      title="Generate Team Charters, assign customizable activity roles, and tailored 5-min multicultural icebreakers"
                    >
                      <Sparkles size={14} /> Team Charters &amp; Icebreakers
                    </button>
                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', paddingLeft: '0.2rem' }}>
                      Assign roles &amp; 5-min icebreakers
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowAssignModal(true)}
                    disabled={isGenerating || students.length === 0}
                    style={{ padding: '0.55rem 1.4rem', fontSize: '0.86rem', fontWeight: 800, boxShadow: '0 4px 16px var(--primary-glow)' }}
                    title="Save team assignments to the active classroom roster"
                  >
                    <Check size={16} /> Apply to Class Roster
                  </button>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', paddingLeft: '0.2rem' }}>
                    Saves team assignments to roster
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODAL: CONFIRM RESHUFFLE ─────────────────────────────────────────────── */}
      {showReshuffleModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setShowReshuffleModal(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100060, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(8px)',
            padding: '1.25rem',
            animation: 'fadeIn 120ms ease' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '420px', width: '100%', padding: '1.5rem', backgroundColor: 'var(--bg-surface)', margin: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <Shuffle size={20} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Shuffle Combinations</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
              This will re-run the simulated annealing algorithm with your active custom rules and weightages to generate a fresh team combination.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReshuffleModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmReshuffle} style={{ fontWeight: 800 }}>
                Shuffle Combinations
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: CONFIRM ASSIGN TO ROSTER ───────────────────────────────────────── */}
      {showAssignModal && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setShowAssignModal(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100060, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(8px)',
            padding: '1.25rem',
            animation: 'fadeIn 120ms ease' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', backgroundColor: 'var(--bg-surface)', margin: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={22} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Apply Teams to Class Roster</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
              Are you sure you want to update all <strong>{students.length} students</strong> in the active class roster with their new team assignments?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmAssign} style={{ fontWeight: 800 }}>
                Confirm &amp; Apply to Roster
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: SINGLE TEAM EXPORT ─────────────────────────────────────────────── */}
      {exportModal.isOpen && exportModal.team && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100060, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(8px)',
            padding: '1.25rem',
            animation: 'fadeIn 120ms ease' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', backgroundColor: 'var(--bg-surface)', margin: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Export {exportModal.team.groupName}
              </h3>
              <button type="button" onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  File Format
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${exportModal.format === 'xlsx' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setExportModal(prev => ({ ...prev, format: 'xlsx' }))}
                    style={{ flex: 1 }}
                  >
                    <FileSpreadsheet size={13} /> Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${exportModal.format === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setExportModal(prev => ({ ...prev, format: 'csv' }))}
                    style={{ flex: 1 }}
                  >
                    <FileText size={13} /> CSV (.csv)
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExportModal(prev => ({ ...prev, isOpen: false }))}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleExecuteExport} style={{ fontWeight: 800 }}>
                <Download size={13} /> Download Export
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: STUDENT DETAILS (WELL-PLACED & PROPERLY CENTERED) ──────────────── */}
      {selectedStudent && createPortal(
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedStudent(null)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 100070, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(15, 23, 42, 0.65)', 
            backdropFilter: 'blur(8px)',
            padding: '1.25rem',
            animation: 'fadeIn 150ms ease' 
          }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '460px', 
              width: '100%', 
              padding: '1.5rem', 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-color)', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              margin: 'auto',
              animation: 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.05rem' }}>
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedStudent.name}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{selectedStudent.email || selectedStudent.id || 'Student Profile'}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStudent(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem', backgroundColor: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Gender</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.gender || 'Unspecified'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Nationality</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.nationality || 'Unspecified'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '0.15rem' }}>University / Campus</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.university || 'Unassigned'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '0.15rem' }}>CEFR Language</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.englishProficiency || 'Fluent (C1/C2)'}</span>
              </div>
              {selectedStudent.degree && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Degree / Major</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.degree}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)} style={{ padding: '0.45rem 1.25rem', fontWeight: 700 }}>
                Close
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
