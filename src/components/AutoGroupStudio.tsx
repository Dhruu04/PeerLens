import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Sparkles, Check, Globe, 
  Shuffle, Languages, Layers, ChevronDown, ChevronUp,
  LayoutGrid, Kanban, GripVertical, Download, FileSpreadsheet,
  FileText, X, GraduationCap, Plane, Table, Columns3, ArrowRightLeft,
  Sliders, Plus, Trash2, AlertCircle, CheckCircle2,
  Settings2, Compass, Search, RotateCcw,
  Pin, PinOff, Undo2, Redo2, Target, Zap, ArrowRight,
  Lock, Unlock, UserX, UserCheck, Send
} from 'lucide-react';
import type { Student } from '../utils/math';
import { 
  generateDiverseGroups, 
  calculateGroupReport,
  discoverRosterFields,
  DEFAULT_GROUPING_RULES,
  normalizeRule,
  type GroupingRule,
  type GroupingRuleMode,
  type DiversityGroupingResult,
  type GroupDiversityReport
} from '../utils/grouping';
import { exportSingleTeamToCSV, exportSingleTeamToExcel } from '../utils/csv';
import CustomSelect from './CustomSelect';
import { EditableModuleSlot } from './EditableModuleSlot';
import { 
  loadFeatureToggles, 
  subscribeFeatureToggles, 
  saveFeatureToggle, 
  type FeatureToggles 
} from '../utils/featurePreferences';
import { getShortcutTooltip } from '../utils/keyboardShortcuts';

interface AutoGroupStudioProps {
  students: Student[];
  onApplyGroups: (updatedStudents: Student[]) => void;
  onLoadSampleStudents?: () => void;
  defaultExpanded?: boolean;
  onOpenTeamCharter?: (stagedStudents?: Student[]) => void;
  isEditMode?: boolean;
  featureToggles?: FeatureToggles;
  onToggleModule?: (key: keyof FeatureToggles, nextVisible: boolean) => void;
  classId?: string;
  onStagedGroupsChange?: (stagedStudents: Student[]) => void;
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
  onOpenTeamCharter,
  isEditMode = false,
  featureToggles: featureTogglesProp,
  onToggleModule,
  classId,
  onStagedGroupsChange
}) => {
  const [internalToggles, setInternalToggles] = useState<FeatureToggles>(loadFeatureToggles);

  useEffect(() => {
    if (!featureTogglesProp) {
      return subscribeFeatureToggles(setInternalToggles);
    }
  }, [featureTogglesProp]);

  const activeToggles = featureTogglesProp || internalToggles;
  const handleToggle = onToggleModule || ((key: keyof FeatureToggles, val: boolean) => saveFeatureToggle(key, val));

  const [isExpanded, setIsExpanded] = useState<boolean>(isEditMode || defaultExpanded);

  // Automatically keep expanded in Edit Mode so users can view and customize modules & sub-modules
  useEffect(() => {
    if (isEditMode) {
      setIsExpanded(true);
    }
  }, [isEditMode]);

  const effectiveExpanded = isExpanded || isEditMode;

  const [targetSize, setTargetSize] = useState<number>(4);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('4');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTargetSizeInput(String(targetSize));
  }, [targetSize]);
  const [prefix, setPrefix] = useState<string>('Team');
  const [customPrefix, setCustomPrefix] = useState<string>('Pod');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban' | 'table' | 'compact'>('grid');
  const [kanbanLayout, setKanbanLayout] = useState<'wrap' | 'scroll' | 'compact'>('wrap');
  const [showWeightDistribution, setShowWeightDistribution] = useState<boolean>(false);

  // Fallback layout if active viewMode layout gets toggled off
  useEffect(() => {
    const isCurrentModeVisible = 
      (viewMode === 'grid' && activeToggles.showAutoGroupViewGrid) ||
      (viewMode === 'kanban' && activeToggles.showAutoGroupViewKanban) ||
      (viewMode === 'table' && activeToggles.showAutoGroupViewTable) ||
      (viewMode === 'compact' && activeToggles.showAutoGroupViewCompact);

    if (!isCurrentModeVisible) {
      if (activeToggles.showAutoGroupViewGrid) {
        setViewMode('grid');
      } else if (activeToggles.showAutoGroupViewKanban) {
        setViewMode('kanban');
      } else if (activeToggles.showAutoGroupViewTable) {
        setViewMode('table');
      } else if (activeToggles.showAutoGroupViewCompact) {
        setViewMode('compact');
      }
    }
  }, [
    viewMode, 
    activeToggles.showAutoGroupViewGrid, 
    activeToggles.showAutoGroupViewKanban, 
    activeToggles.showAutoGroupViewTable, 
    activeToggles.showAutoGroupViewCompact
  ]);
  const [isRulesExpanded, setIsRulesExpanded] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  // Custom Rules State with LocalStorage Persistence
  const [rules, setRules] = useState<GroupingRule[]>(() => {
    try {
      const saved = localStorage.getItem('peerlens_custom_grouping_rules_v3') || localStorage.getItem('peerlens_custom_grouping_rules_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeRule);
        }
      }
    } catch (e) {
      console.error('Failed to load grouping rules from storage', e);
    }
    return DEFAULT_GROUPING_RULES.map(normalizeRule);
  });



  // Pinned / Locked Students State
  const [pinnedStudentIds, setPinnedStudentIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Student[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Instant 2-Click Teammate Swap State
  const [swappingStudentId, setSwappingStudentId] = useState<string | null>(null);

  // Floating Unassigned Students Drawer / Dock State
  const [isUnassignedDockOpen, setIsUnassignedDockOpen] = useState<boolean>(false);

  // Grouping Calculation Result
  const [groupingResult, setGroupingResult] = useState<DiversityGroupingResult | null>(null);

  // Quick Drop Bar Pinning State (Unpinned by default so it scrolls away)
  const [isQuickBarPinned, setIsQuickBarPinned] = useState<boolean>(false);

  // Modals State
  const [showReshuffleModal, setShowReshuffleModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [transferringStudentId, setTransferringStudentId] = useState<string | null>(null);
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

  const transferringStudent = useMemo(() => {
    if (!transferringStudentId || !groupingResult) return null;
    return groupingResult.updatedStudents.find(s => s.id === transferringStudentId) || null;
  }, [transferringStudentId, groupingResult]);

  useEffect(() => {
    try {
      localStorage.setItem('peerlens_custom_grouping_rules_v3', JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save grouping rules', e);
    }
  }, [rules]);

  useEffect(() => {
    const handleCollapse = () => setIsExpanded(false);
    const handleExpand = () => setIsExpanded(true);
    const handleToggleExpansion = () => setIsExpanded(prev => !prev);
    window.addEventListener('peerlens_collapse_all', handleCollapse);
    window.addEventListener('peerlens_expand_all', handleExpand);
    window.addEventListener('peerlens_toggle_autogroup_expanded', handleToggleExpansion);
    return () => {
      window.removeEventListener('peerlens_collapse_all', handleCollapse);
      window.removeEventListener('peerlens_expand_all', handleExpand);
      window.removeEventListener('peerlens_toggle_autogroup_expanded', handleToggleExpansion);
    };
  }, []);

  const hasInitializedRef = React.useRef(false);

  // Synchronize grouping state with class roster students
  useEffect(() => {
    if (!students || students.length === 0) {
      setGroupingResult(null);
      return;
    }

    // Inspect existing assignments in the current roster
    const existingGroupMap: Record<string, Student[]> = {};
    const unassignedList: Student[] = [];

    students.forEach(s => {
      const g = (s.groupName || '').trim();
      if (!g || g.toLowerCase() === 'unassigned' || g.toLowerCase() === 'none') {
        unassignedList.push({ ...s, groupName: 'Unassigned' });
      } else {
        if (!existingGroupMap[g]) existingGroupMap[g] = [];
        existingGroupMap[g].push(s);
      }
    });

    const existingGroupNames = Object.keys(existingGroupMap);

    // If there are existing teams formed in the class roster, preserve them and place unassigned in the drawer!
    if (existingGroupNames.length > 0) {
      const groups: GroupDiversityReport[] = existingGroupNames.map(gName => {
        return calculateGroupReport(gName, existingGroupMap[gName], 3.5, activeRules);
      });

      const avgScore = groups.length > 0
        ? Math.round(groups.reduce((acc, g) => acc + g.diversityScore, 0) / groups.length)
        : 100;

      const allUpdatedStudents = [
        ...Object.values(existingGroupMap).flat(),
        ...unassignedList
      ];

      setGroupingResult({
        groups,
        updatedStudents: allUpdatedStudents,
        overallDiversityScore: avgScore,
        activeRulesCount: activeRules.length,
        overallRuleBreakdown: [],
        genderBalanceRating: avgScore >= 85 ? 'Optimal' : avgScore >= 70 ? 'Good' : 'Moderate',
        nationalityMixRating: avgScore >= 80 ? 'Highly Mixed' : avgScore >= 65 ? 'Balanced' : 'Moderate',
        englishMixRating: avgScore >= 75 ? 'Evenly Distributed' : avgScore >= 60 ? 'Good' : 'Fair',
        customFieldRating: avgScore >= 80 ? 'Optimal' : avgScore >= 65 ? 'Good' : 'Moderate'
      });
      setHistory([allUpdatedStudents]);
      setHistoryIndex(0);
      hasInitializedRef.current = true;
    } else if (!hasInitializedRef.current) {
      // If no teams exist yet and first time loading, run initial optimization:
      hasInitializedRef.current = true;
      runOptimization();
    }
  }, [students]);

  // Persist staged Auto-Group students and notify parent so Team Collaboration Agreement & Roles Studio can use them
  useEffect(() => {
    if (groupingResult?.updatedStudents && groupingResult.updatedStudents.length > 0) {
      if (classId) {
        try {
          localStorage.setItem(`peerlens_staged_autogroups_${classId}`, JSON.stringify(groupingResult.updatedStudents));
        } catch (e) {
          console.warn('Failed to persist staged autogroups', e);
        }
      }
      onStagedGroupsChange?.(groupingResult.updatedStudents);
    }
  }, [groupingResult, classId, onStagedGroupsChange]);

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

  const runOptimization = (overrideSize?: number, overridePrefix?: string) => {
    if (students.length === 0) return;
    setIsGenerating(true);

    const activeSize = overrideSize ?? targetSize;
    const activePrefix = overridePrefix ?? effectivePrefix;

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
        targetSize: activeSize,
        prefix: activePrefix,
        rules,
        pinnedStudentMap: Object.keys(pinnedStudentMap).length > 0 ? pinnedStudentMap : undefined
      });
      setGroupingResult(result);
      setHistory([result.updatedStudents]);
      setHistoryIndex(0);
      setIsGenerating(false);
    }, 40);
  };

  const handleStepTargetSize = (delta: number) => {
    const newSize = Math.max(2, Math.min(totalMembers || 50, targetSize + delta));
    if (newSize !== targetSize) {
      setTargetSize(newSize);
      runOptimization(newSize);
    }
  };

  const handleDirectInputChange = (valStr: string) => {
    setTargetSizeInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= Math.max(2, totalMembers)) {
      setTargetSize(parsed);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        runOptimization(parsed);
      }, 300);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseInt(targetSizeInput, 10);
    if (isNaN(parsed) || parsed < 2) {
      setTargetSize(2);
      setTargetSizeInput('2');
      runOptimization(2);
    } else if (parsed > totalMembers) {
      setTargetSize(totalMembers);
      setTargetSizeInput(String(totalMembers));
      runOptimization(totalMembers);
    }
  };

  const renameGroupsWithPrefix = (newPrefixStr: string) => {
    if (!groupingResult) return;
    const cleanPrefix = newPrefixStr.trim() || 'Team';

    const oldToNewMap: Record<string, string> = {};
    groupingResult.groups.forEach((g, idx) => {
      oldToNewMap[g.groupName] = `${cleanPrefix} ${idx + 1}`;
    });

    const updatedStudents = groupingResult.updatedStudents.map(s => {
      if (s.groupName && oldToNewMap[s.groupName]) {
        return { ...s, groupName: oldToNewMap[s.groupName] };
      }
      return s;
    });

    const updatedGroups = groupingResult.groups.map((g, idx) => {
      const newName = `${cleanPrefix} ${idx + 1}`;
      const groupStudents = updatedStudents.filter(s => s.groupName === newName);
      return {
        ...g,
        groupName: newName,
        students: groupStudents
      };
    });

    setGroupingResult(prev => prev ? {
      ...prev,
      groups: updatedGroups,
      updatedStudents
    } : null);
  };

  const handlePrefixChange = (newPrefix: string) => {
    setPrefix(newPrefix);
    const eff = newPrefix === 'custom' ? (customPrefix.trim() || 'Team') : newPrefix;
    renameGroupsWithPrefix(eff);
  };

  const handleCustomPrefixChange = (newCustom: string) => {
    setCustomPrefix(newCustom);
    if (prefix === 'custom') {
      const eff = newCustom.trim() || 'Team';
      renameGroupsWithPrefix(eff);
    }
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
    const cleanName = df.name.replace(/Diversity|Status|Dispersal|Parity/gi, '').trim() || df.name;
    const newRule: GroupingRule = {
      id: `discovered_rule_${Date.now()}_${df.key}`,
      name: cleanName,
      fieldKey: df.key,
      mode: 'distribute',
      weight: 20,
      enabled: true,
      description: `Distribute students with different ${cleanName.toLowerCase()} across teams`
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

  // Assigned and Unassigned students
  const assignedStudents = useMemo(() => {
    return groupingResult?.updatedStudents.filter(s => s.groupName && s.groupName !== 'Unassigned' && s.groupName !== 'None') || [];
  }, [groupingResult]);

  const unassignedStudents = useMemo(() => {
    return groupingResult?.updatedStudents.filter(s => !s.groupName || s.groupName === 'Unassigned' || s.groupName === 'None') || [];
  }, [groupingResult]);



  // Lock / Unlock a Particular Team
  const handleToggleLockTeam = (groupStudents: Student[]) => {
    if (!groupStudents || groupStudents.length === 0) return;
    const isFullyLocked = groupStudents.every(s => pinnedStudentIds.has(s.id));
    setPinnedStudentIds(prev => {
      const next = new Set(prev);
      if (isFullyLocked) {
        groupStudents.forEach(s => next.delete(s.id));
      } else {
        groupStudents.forEach(s => next.add(s.id));
      }
      return next;
    });
  };

  // Instant 2-Click Swap Teammates
  const handleSwapStudents = (studentAId: string, studentBId: string) => {
    if (!groupingResult || studentAId === studentBId) return;
    const studentA = groupingResult.updatedStudents.find(s => s.id === studentAId);
    const studentB = groupingResult.updatedStudents.find(s => s.id === studentBId);
    if (!studentA || !studentB) return;

    const groupA = studentA.groupName || 'Unassigned';
    const groupB = studentB.groupName || 'Unassigned';
    if (groupA === groupB) return;

    const newStudents = groupingResult.updatedStudents.map(s => {
      if (s.id === studentAId) return { ...s, groupName: groupB };
      if (s.id === studentBId) return { ...s, groupName: groupA };
      return s;
    });

    applyNewStudentAssignment(newStudents, true);
  };

  const handleInitiateSwap = (studentId: string) => {
    if (!swappingStudentId) {
      setSwappingStudentId(studentId);
    } else if (swappingStudentId === studentId) {
      setSwappingStudentId(null);
    } else {
      handleSwapStudents(swappingStudentId, studentId);
      setSwappingStudentId(null);
    }
  };

  // 1-Click Auto-distribute unassigned students
  const handleAutoDistributeUnassigned = () => {
    if (!groupingResult || unassignedStudents.length === 0 || groupingResult.groups.length === 0) return;
    const groupCounts: Record<string, number> = {};
    groupingResult.groups.forEach(g => {
      groupCounts[g.groupName] = g.students.length;
    });

    const newStudents = [...groupingResult.updatedStudents];
    unassignedStudents.forEach(unassigned => {
      let targetGroup = groupingResult.groups[0].groupName;
      let minCount = Infinity;
      groupingResult.groups.forEach(g => {
        const count = groupCounts[g.groupName] ?? 0;
        if (count < minCount) {
          minCount = count;
          targetGroup = g.groupName;
        }
      });
      groupCounts[targetGroup] = (groupCounts[targetGroup] ?? 0) + 1;
      const idx = newStudents.findIndex(s => s.id === unassigned.id);
      if (idx !== -1) {
        newStudents[idx] = { ...newStudents[idx], groupName: targetGroup };
      }
    });

    applyNewStudentAssignment(newStudents, true);
  };

  // Keyboard shortcut listener integration
  useEffect(() => {
    const onToggleUnassigned = () => setIsUnassignedDockOpen(prev => !prev);
    const onToggleQuickTargets = () => setIsQuickBarPinned(prev => !prev);
    const onReshuffle = () => runOptimization();
    const onEscapeKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (swappingStudentId) setSwappingStudentId(null);
        if (transferringStudentId) setTransferringStudentId(null);
      }
    };

    window.addEventListener('peerlens_toggle_unassigned_dock', onToggleUnassigned);
    window.addEventListener('peerlens_toggle_quick_targets', onToggleQuickTargets);
    window.addEventListener('peerlens_reshuffle_teams', onReshuffle);
    window.addEventListener('keydown', onEscapeKeyDown);

    return () => {
      window.removeEventListener('peerlens_toggle_unassigned_dock', onToggleUnassigned);
      window.removeEventListener('peerlens_toggle_quick_targets', onToggleQuickTargets);
      window.removeEventListener('peerlens_reshuffle_teams', onReshuffle);
      window.removeEventListener('keydown', onEscapeKeyDown);
    };
  }, [assignedStudents, swappingStudentId, transferringStudentId]);

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
  const plannedTeamsCount = targetSize > 0 ? Math.ceil(totalMembers / targetSize) : 0;

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
        onClick={() => {
          if (!isEditMode) {
            setIsExpanded(!isExpanded);
          }
        }}
        style={{ 
          padding: '1rem 1.25rem', 
          cursor: isEditMode ? 'default' : 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: effectiveExpanded ? 'var(--bg-app)' : 'var(--bg-surface)',
          borderBottom: effectiveExpanded ? '1px solid var(--border-color)' : 'none',
          borderTopLeftRadius: 'calc(var(--radius-lg) - 1px)',
          borderTopRightRadius: 'calc(var(--radius-lg) - 1px)',
          borderBottomLeftRadius: effectiveExpanded ? '0' : 'calc(var(--radius-lg) - 1px)',
          borderBottomRightRadius: effectiveExpanded ? '0' : 'calc(var(--radius-lg) - 1px)',
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
                Auto-Group Teams
              </span>
              {activeRules.length > 0 && (
                <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                  {activeRules.length} Active {activeRules.length === 1 ? 'Rule' : 'Rules'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Automatically forms balanced student groups using rules (diversity, skills, size).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <EditableModuleSlot
            moduleKey="showAutoGroupRuleCompliance"
            isEditMode={isEditMode}
            isVisible={activeToggles.showAutoGroupRuleCompliance}
            onToggle={handleToggle}
            slotType="button"
            inline
          >
            {groupingResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rule Compliance:</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {groupingResult.overallDiversityScore}%
                </span>
              </div>
            )}
          </EditableModuleSlot>
          <button
            type="button"
            className="btn btn-icon btn-secondary btn-sm"
            style={{ borderRadius: '50%' }}
            aria-label={effectiveExpanded ? 'Collapse Studio' : 'Expand Studio'}
            disabled={isEditMode}
            title={isEditMode ? 'Studio is kept open in Edit Mode for sub-module customization' : (isExpanded ? 'Collapse Studio' : 'Expand Studio')}
          >
            {effectiveExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Studio Expanded Body */}
      {effectiveExpanded && (
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
            {/* Tile 1: Target Size with Steppers & Dynamic Breakdown */}
            <EditableModuleSlot
              moduleKey="showAutoGroupTargetSize"
              isEditMode={isEditMode}
              isVisible={activeToggles.showAutoGroupTargetSize}
              onToggle={handleToggle}
              slotType="card"
            >
              <div 
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  height: '100%',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '8px', 
                      backgroundColor: 'rgba(13, 148, 136, 0.12)', 
                      color: 'var(--teal)' 
                    }}>
                      <Users size={16} />
                    </div>
                    <label style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                      Target Team Size
                    </label>
                  </div>
                  <span 
                    className="badge badge-teal" 
                    style={{ 
                      fontSize: '0.74rem', 
                      padding: '0.22rem 0.65rem', 
                      fontWeight: 800,
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(13, 148, 136, 0.15)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Layers size={12} />
                    {plannedTeamsCount} {plannedTeamsCount === 1 ? 'Team' : 'Teams'} planned
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Stepper Input */}
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    backgroundColor: 'var(--bg-app)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '9px', 
                    overflow: 'hidden', 
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)', 
                    flexShrink: 0,
                    height: '38px',
                    padding: '2px'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleStepTargetSize(-1)}
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
                        fontSize: '1.1rem',
                        borderRadius: '7px',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      title="Decrease team size"
                      aria-label="Decrease team size"
                    >
                      -
                    </button>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={targetSizeInput}
                      onChange={(e) => handleDirectInputChange(e.target.value)}
                      onBlur={handleInputBlur}
                      style={{ 
                        fontWeight: 800, 
                        textAlign: 'center', 
                        height: '34px', 
                        width: '46px', 
                        border: 'none', 
                        background: 'transparent', 
                        color: 'var(--text-primary)',
                        fontSize: '0.96rem',
                        outline: 'none'
                      }}
                      title="Type target team size"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepTargetSize(1)}
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
                        fontSize: '1.1rem',
                        borderRadius: '7px',
                        transition: 'background 0.15s, color 0.15s'
                      }}
                      title="Increase team size"
                      aria-label="Increase team size"
                    >
                      +
                    </button>
                  </div>

                  {/* Cohort Info Pill */}
                  <div style={{ 
                    flex: 1, 
                    minWidth: 0,
                    height: '38px',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.45rem',
                    padding: '0 0.85rem', 
                    backgroundColor: 'var(--bg-app)', 
                    borderRadius: '9px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Users size={14} className="text-teal" />
                    <span><strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{totalMembers}</strong> students total</span>
                  </div>
                </div>
              </div>
            </EditableModuleSlot>

            {/* Tile 2: Team Prefix & Group Naming Format */}
            <EditableModuleSlot
              moduleKey="showAutoGroupNamingFormat"
              isEditMode={isEditMode}
              isVisible={activeToggles.showAutoGroupNamingFormat}
              onToggle={handleToggle}
              slotType="card"
            >
              <div 
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  height: '100%',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '8px', 
                      backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                      color: 'var(--primary)' 
                    }}>
                      <Layers size={16} />
                    </div>
                    <label style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                      Team Name Style
                    </label>
                  </div>
                  <span style={{ 
                    fontSize: '0.74rem', 
                    color: 'var(--primary)', 
                    fontWeight: 800,
                    backgroundColor: 'var(--primary-light)',
                    padding: '0.22rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}>
                    <Sparkles size={12} /> Preview: {effectivePrefix} 1, {effectivePrefix} 2...
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '38px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <CustomSelect
                      options={PREFIX_OPTIONS}
                      value={prefix}
                      onChange={(val) => handlePrefixChange(val)}
                    />
                  </div>
                  {prefix === 'custom' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Squad, Lab, Pod..."
                      value={customPrefix}
                      onChange={(e) => handleCustomPrefixChange(e.target.value)}
                      style={{ height: '38px', fontSize: '0.84rem', fontWeight: 600, width: '140px', borderRadius: '8px' }}
                    />
                  )}
                </div>
              </div>
            </EditableModuleSlot>
          </div>

          {/* ── CUSTOM RULES & CONSTRAINTS STUDIO CARD (CONTRACTABLE) ───────────────────── */}
          <EditableModuleSlot
            moduleKey="showAutoGroupRulesCard"
            isEditMode={isEditMode}
            isVisible={activeToggles.showAutoGroupRulesCard}
            onToggle={handleToggle}
            slotType="card"
          >
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
                  <EditableModuleSlot
                    moduleKey="showAutoGroupResetRulesBtn"
                    isEditMode={isEditMode}
                    isVisible={activeToggles.showAutoGroupResetRulesBtn}
                    onToggle={handleToggle}
                    slotType="button"
                    inline
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
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
                    </div>
                  </EditableModuleSlot>
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

                {/* Proportional Weight Breakdown Bar - Modular Toggle Slot */}
                {activeRules.length > 0 && totalActiveWeight > 0 && (
                  <EditableModuleSlot
                    moduleKey="showAutoGroupWeightDistribution"
                    isEditMode={isEditMode}
                    isVisible={activeToggles.showAutoGroupWeightDistribution}
                    onToggle={handleToggle}
                    slotType="card"
                  >
                    <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setShowWeightDistribution(!showWeightDistribution)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.95rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 750,
                          color: 'var(--text-secondary)'
                        }}
                        title={showWeightDistribution ? "Collapse weight distribution breakdown" : "Expand weight distribution breakdown"}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Sliders size={13} className="text-teal" />
                          <span>Overall Optimization Weight Distribution</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>{activeRules.length} active criteria ({totalActiveWeight} pts total)</span>
                          {showWeightDistribution ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {showWeightDistribution && (
                        <div style={{ padding: '0.75rem 0.95rem 0.85rem 0.95rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.55rem', backgroundColor: 'var(--bg-surface)' }}>
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
                    </div>
                  </EditableModuleSlot>
                )}



            {/* Quick-Add Discovered Cohort Attributes Strip */}
            {discoveredFields.length > 0 && (
              <EditableModuleSlot
                moduleKey="showAutoGroupDiscoveredFields"
                isEditMode={isEditMode}
                isVisible={activeToggles.showAutoGroupDiscoveredFields}
                onToggle={handleToggle}
                slotType="bar"
              >
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
              </EditableModuleSlot>
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
                  const ruleColor = RULE_PALETTE[idx % RULE_PALETTE.length];

                  return (
                    <div 
                      key={rule.id} 
                      className={`autogroup-rule-card ${!rule.enabled ? 'disabled' : ''}`}
                    >
                      <div className="autogroup-rule-row-grid">
                        
                        {/* Col 1: Toggle + Icon + Title + Attribute Pill + Description */}
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
                              <span className="badge badge-secondary" style={{ fontSize: '0.64rem', padding: '0.08rem 0.35rem', opacity: 0.75 }}>
                                {rule.fieldKey}
                              </span>
                            </div>
                            {rule.description && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1.35, marginTop: '0.15rem' }}>
                                {rule.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Col 2: Goal Toggle (Distribute vs Keep Together) */}
                        <div className="autogroup-mode-pill-group">
                          <button
                            type="button"
                            onClick={() => handleModeChange(rule.id, 'distribute')}
                            className={`autogroup-mode-pill ${rule.mode !== 'together' && rule.mode !== 'group' && rule.mode !== 'cluster' ? 'active' : ''}`}
                            title="Distribute: Spread students with this trait across different teams"
                            disabled={!rule.enabled}
                          >
                            <Shuffle size={11} /> Distribute
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeChange(rule.id, 'together')}
                            className={`autogroup-mode-pill ${rule.mode === 'together' || rule.mode === 'group' || rule.mode === 'cluster' ? 'active' : ''}`}
                            title="Keep Together: Place matching students together in the same team"
                            disabled={!rule.enabled}
                          >
                            <Users size={11} /> Keep Together
                          </button>
                        </div>

                        {/* Col 3: Priority Tiers (Low / Medium / High / Max) */}
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
                              className={`autogroup-priority-btn ${rule.weight >= 45 ? 'active max-tier' : ''}`}
                              disabled={!rule.enabled}
                              title="Max priority (50 pts) - top constraint with maximum penalty"
                            >
                              Max
                            </button>
                          </div>
                        </div>

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
    </EditableModuleSlot>

          {/* ── TEAMS PREVIEW TOOLBAR & LAYOUT SWITCHER ─────────────────────────────── */}
          {students.length > 0 && groupingResult && (
            <EditableModuleSlot
              moduleKey="showAutoGroupToolbar"
              isEditMode={isEditMode}
              isVisible={activeToggles.showAutoGroupToolbar}
              onToggle={handleToggle}
              slotType="bar"
            >
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
                  <div style={{ display: 'inline-flex', backgroundColor: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '2px', alignItems: 'center' }}>
                    <EditableModuleSlot
                      moduleKey="showAutoGroupViewGrid"
                      isEditMode={isEditMode}
                      isVisible={activeToggles.showAutoGroupViewGrid}
                      onToggle={handleToggle}
                      slotType="button"
                      inline
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                      >
                        <LayoutGrid size={13} /> Grid
                      </button>
                    </EditableModuleSlot>

                    <EditableModuleSlot
                      moduleKey="showAutoGroupViewKanban"
                      isEditMode={isEditMode}
                      isVisible={activeToggles.showAutoGroupViewKanban}
                      onToggle={handleToggle}
                      slotType="button"
                      inline
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode('kanban')}
                        className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                        title="Board View: Drag-and-drop column view to move students between teams"
                      >
                        <Kanban size={13} /> Board View
                      </button>
                    </EditableModuleSlot>

                    <EditableModuleSlot
                      moduleKey="showAutoGroupViewTable"
                      isEditMode={isEditMode}
                      isVisible={activeToggles.showAutoGroupViewTable}
                      onToggle={handleToggle}
                      slotType="button"
                      inline
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                      >
                        <Table size={13} /> Detailed Table
                      </button>
                    </EditableModuleSlot>

                    <EditableModuleSlot
                      moduleKey="showAutoGroupViewCompact"
                      isEditMode={isEditMode}
                      isVisible={activeToggles.showAutoGroupViewCompact}
                      onToggle={handleToggle}
                      slotType="button"
                      inline
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode('compact')}
                        className={`btn btn-sm ${viewMode === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.32rem 0.75rem', fontSize: '0.76rem', borderRadius: '6px', fontWeight: 700 }}
                        title="Compact Cards: Dense view showing all teams side-by-side"
                      >
                        <Columns3 size={13} /> Compact Cards
                      </button>
                    </EditableModuleSlot>
                  </div>
                </div>

                {/* History & Pin Controls */}
                {/* 1. History Controls (Undo / Redo) */}
                <EditableModuleSlot
                  moduleKey="showAutoGroupHistoryControls"
                  isEditMode={isEditMode}
                  isVisible={activeToggles.showAutoGroupHistoryControls}
                  onToggle={handleToggle}
                  slotType="button"
                  inline
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="btn btn-sm btn-secondary"
                      title={getShortcutTooltip("Undo team assignment", "undo_team_move")}
                      aria-label="Undo team assignment"
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        borderRadius: '6px',
                        opacity: historyIndex <= 0 ? 0.45 : 1,
                        cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Undo2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="btn btn-sm btn-secondary"
                      title={getShortcutTooltip("Redo team assignment", "redo_team_move")}
                      aria-label="Redo team assignment"
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        borderRadius: '6px',
                        opacity: historyIndex >= history.length - 1 ? 0.45 : 1,
                        cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Redo2 size={13} />
                    </button>
                  </div>
                </EditableModuleSlot>

                {/* 2. Unassigned Students Quick Drawer Trigger (Hidden by default) */}
                <EditableModuleSlot
                  moduleKey="showAutoGroupUnassignedDrawer"
                  isEditMode={isEditMode}
                  isVisible={activeToggles.showAutoGroupUnassignedDrawer}
                  onToggle={handleToggle}
                  slotType="button"
                  inline
                >
                  <button
                    type="button"
                    onClick={() => setIsUnassignedDockOpen(prev => !prev)}
                    className={`btn btn-sm ${isUnassignedDockOpen ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      height: '28px',
                      padding: '0 0.55rem',
                      fontSize: '0.74rem',
                      borderRadius: '6px',
                      color: isUnassignedDockOpen ? '#ffffff' : unassignedStudents.length > 0 ? 'var(--accent-rose, #e11d48)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      transition: 'all 0.15s ease'
                    }}
                    title={getShortcutTooltip(`Unassigned Students Drawer (${unassignedStudents.length} unassigned)`, "toggle_unassigned_dock")}
                    aria-label="Toggle Unassigned Students Drawer"
                  >
                    <UserX size={12} style={{ color: isUnassignedDockOpen ? '#ffffff' : unassignedStudents.length > 0 ? 'var(--accent-rose, #e11d48)' : 'inherit' }} />
                    <span style={{ 
                      fontSize: '0.62rem', 
                      padding: '0.04rem 0.26rem', 
                      borderRadius: '4px', 
                      backgroundColor: unassignedStudents.length > 0 ? 'rgba(225, 29, 72, 0.15)' : 'var(--border-color)', 
                      color: unassignedStudents.length > 0 ? 'var(--accent-rose, #e11d48)' : 'var(--text-muted)', 
                      fontWeight: 800 
                    }}>
                      {unassignedStudents.length}
                    </span>
                  </button>
                </EditableModuleSlot>

                {/* Search Filter Input */}
                <EditableModuleSlot
                  moduleKey="showAutoGroupSearchFilter"
                  isEditMode={isEditMode}
                  isVisible={activeToggles.showAutoGroupSearchFilter}
                  onToggle={handleToggle}
                  slotType="bar"
                  style={{ minWidth: '240px', flex: '1 1 240px', maxWidth: '340px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
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
                </EditableModuleSlot>
              </div>
            </EditableModuleSlot>
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
              
              {/* All-Teams Quick Drop Target Strip (Sticky when pinned, scrolls away when unpinned) */}
              <EditableModuleSlot
                moduleKey="showAutoGroupQuickTargets"
                isEditMode={isEditMode}
                isVisible={activeToggles.showAutoGroupQuickTargets}
                onToggle={handleToggle}
                slotType="bar"
                style={{
                  position: isQuickBarPinned ? 'sticky' : 'relative',
                  top: isQuickBarPinned ? '12px' : 'auto',
                  zIndex: isQuickBarPinned ? 960 : 10
                }}
              >
                <div 
                  className="autogroup-sticky-quick-bar"
                  style={{ 
                    position: isQuickBarPinned ? 'sticky' : 'relative',
                    top: isQuickBarPinned ? '12px' : 'auto',
                    zIndex: isQuickBarPinned ? 960 : 10,
                    padding: '0.65rem 0.85rem', 
                    backgroundColor: 'var(--bg-surface)', 
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: 'var(--radius-md)', 
                    border: draggedStudentId ? '1.5px dashed var(--accent-teal)' : '1px solid var(--border-color)',
                    boxShadow: isQuickBarPinned ? '0 6px 20px rgba(0, 0, 0, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: draggedStudentId ? 'var(--accent-teal)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {draggedStudentId ? <Zap size={13} className="text-teal" /> : <Target size={13} className="text-teal" />}
                      {draggedStudentId ? 'Drop card onto any team below for instant move:' : 'Quick Team Drop & Jump Targets:'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-secondary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.45rem',
                          backgroundColor: 'var(--bg-secondary, rgba(0, 0, 0, 0.04))',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          fontWeight: 650
                        }}
                        title={`${groupingResult.groups.length} generated teams available`}
                      >
                        <Users size={12} className="text-teal" />
                        <span>{groupingResult.groups.length} {groupingResult.groups.length === 1 ? 'Team' : 'Teams'}</span>
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsQuickBarPinned(prev => !prev);
                        }}
                        className={`btn btn-sm ${isQuickBarPinned ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          width: '26px',
                          height: '26px',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isQuickBarPinned ? '0 2px 6px rgba(13, 148, 136, 0.25)' : 'none'
                        }}
                        aria-label={isQuickBarPinned ? 'Unpin jump bar from top' : 'Pin jump bar to top'}
                        title={isQuickBarPinned ? 'Pinned to top (Click to unpin)' : 'Pin jump bar to top'}
                      >
                        {isQuickBarPinned ? <Pin size={12} style={{ transform: 'rotate(0deg)' }} /> : <PinOff size={12} style={{ opacity: 0.7 }} />}
                      </button>
                    </div>
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
                            if (transferringStudentId) {
                              handleMoveStudent(transferringStudentId, g.groupName);
                              setTransferringStudentId(null);
                              return;
                            }
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
              </EditableModuleSlot>

              {/* Active Student Transfer Banner */}
              {transferringStudent && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 1rem',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  marginBottom: '0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px var(--primary-glow)',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Send size={15} style={{ transform: 'translateX(-1px)' }} />
                    <span>
                      Select destination: Click any team card or column below to transfer <strong>{transferringStudent.name}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTransferringStudentId(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.22)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 700,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Cancel (Esc)
                  </button>
                </div>
              )}

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
                        <Kanban size={14} className="text-teal" /> Board View
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
                      const isTeamFullyLocked = group.students.length > 0 && group.students.every(s => pinnedStudentIds.has(s.id));
                      const sim = simulationReports ? simulationReports[group.groupName] : null;

                      return (
                        <div
                          id={`kanban-team-col-${group.groupName}`}
                          key={group.groupName}
                          data-group-name={group.groupName}
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
                          onClick={(e) => {
                            if (transferringStudentId) {
                              e.stopPropagation();
                              handleMoveStudent(transferringStudentId, group.groupName);
                              setTransferringStudentId(null);
                            }
                          }}
                          style={{
                            minWidth: kanbanLayout === 'scroll' ? '275px' : 'auto',
                            maxWidth: kanbanLayout === 'scroll' ? '290px' : 'none',
                            flexShrink: kanbanLayout === 'scroll' ? 0 : 1,
                            backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.05)' : transferringStudentId && transferringStudent?.groupName !== group.groupName ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-app)',
                            border: isDragOver ? '2px dashed var(--accent-teal)' : transferringStudentId && transferringStudent?.groupName !== group.groupName ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: isDragOver ? '0 0 0 3px rgba(13, 148, 136, 0.15)' : transferringStudentId && transferringStudent?.groupName !== group.groupName ? '0 0 0 2px var(--primary-glow)' : 'none',
                            cursor: transferringStudentId && transferringStudent?.groupName !== group.groupName ? 'pointer' : 'default',
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: kanbanLayout === 'compact' ? '0.8rem' : '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                  {group.groupName}
                                </span>
                                {transferringStudentId && transferringStudent?.groupName !== group.groupName && (
                                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                    Click to move here
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                                {group.studentCount} {group.studentCount === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {/* 1-Click Lock / Unlock Entire Team */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLockTeam(group.students);
                                }}
                                style={{
                                  background: isTeamFullyLocked ? 'rgba(245, 158, 11, 0.15)' : 'none',
                                  border: isTeamFullyLocked ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                                  color: isTeamFullyLocked ? '#d97706' : 'var(--text-muted)',
                                  borderRadius: '4px',
                                  padding: '0.12rem 0.25rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  transition: 'all 0.15s ease'
                                }}
                                title={
                                  isTeamFullyLocked
                                    ? `${group.groupName} is fully locked (${group.students.length}/${group.students.length}). Click to unlock.`
                                    : pinnedInGroup > 0
                                      ? `${pinnedInGroup}/${group.students.length} locked in ${group.groupName}. Click to lock entire team.`
                                      : `Lock entire ${group.groupName} to freeze all members during re-shuffle`
                                }
                                aria-label={isTeamFullyLocked ? `Unlock ${group.groupName}` : `Lock ${group.groupName}`}
                              >
                                {isTeamFullyLocked ? <Lock size={11} /> : <Unlock size={11} />}
                              </button>
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
                              {activeToggles.showAutoGroupDiversityPercentages && (
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
                              )}
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
                                  data-student-id={student.id}
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
                                  onClick={() => {
                                    if (transferringStudentId) {
                                      if (transferringStudentId !== student.id) {
                                        handleMoveStudent(transferringStudentId, group.groupName);
                                        setTransferringStudentId(null);
                                        return;
                                      }
                                    }
                                    if (swappingStudentId) {
                                      if (swappingStudentId === student.id) {
                                        setSwappingStudentId(null);
                                      } else {
                                        handleSwapStudents(swappingStudentId, student.id);
                                        setSwappingStudentId(null);
                                      }
                                      return;
                                    }
                                    setSelectedStudent(student);
                                  }}
                                  className={`autogroup-kanban-card ${isDraggingThis ? 'is-being-dragged' : ''} ${swappingStudentId === student.id ? 'is-swapping-active' : ''}`}
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
                                        aria-label={isPinned ? "Unpin student" : "Pin student"}
                                      >
                                        <Pin size={12} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                      </button>

                                      {/* Instant 2-Click Swap Teammate Button */}
                                      <button
                                        type="button"
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInitiateSwap(student.id);
                                        }}
                                        className={`autogroup-swap-btn ${swappingStudentId === student.id ? 'active' : ''}`}
                                        style={{
                                          background: swappingStudentId === student.id ? 'var(--primary-light)' : 'none',
                                          border: 'none',
                                          padding: '0.15rem',
                                          cursor: 'pointer',
                                          borderRadius: '4px',
                                          color: swappingStudentId === student.id ? 'var(--primary)' : 'var(--text-muted)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          transition: 'all 0.15s ease'
                                        }}
                                        title={
                                          swappingStudentId === student.id
                                            ? "Cancel swap (or press Esc)"
                                            : swappingStudentId
                                              ? "Swap with selected teammate"
                                              : getShortcutTooltip("Swap teammate", "swap_teammate")
                                        }
                                        aria-label="Swap teammate"
                                      >
                                        <ArrowRightLeft size={11} />
                                      </button>

                                      <button
                                          type="button"
                                          draggable={false}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSwappingStudentId(null);
                                            setTransferringStudentId(prev => prev === student.id ? null : student.id);
                                          }}
                                          className={`autogroup-send-btn ${transferringStudentId === student.id ? 'active' : ''}`}
                                          title={transferringStudentId === student.id ? `Cancel transfer of ${student.name}` : `Transfer ${student.name} to another team (click here, then click destination team)`}
                                          aria-label={`Transfer ${student.name} to another team`}
                                          style={{ width: '22px', height: '22px' }}
                                        >
                                          <Send size={11} style={{ transform: 'translateX(-1px)' }} />
                                        </button>
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
                        const isTeamFullyLocked = group.students.length > 0 && group.students.every(s => pinnedStudentIds.has(s.id));
                        const isDragOver = dragOverGroupId === `table-${group.groupName}`;

                        return (
                          <tr 
                            key={group.groupName}
                            data-group-name={group.groupName}
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
                                <button
                                  type="button"
                                  className={`p-1 rounded-md transition-all ${isTeamFullyLocked ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleLockTeam(group.students);
                                  }}
                                  title={isTeamFullyLocked ? `Unlock all students in ${group.groupName}` : `Lock all students in ${group.groupName}`}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                                >
                                  {isTeamFullyLocked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} />}
                                </button>
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
                                  backgroundColor: activeToggles.showAutoGroupDiversityPercentages ? 'var(--primary-light)' : 'transparent', 
                                  color: activeToggles.showAutoGroupDiversityPercentages ? 'var(--primary)' : 'var(--text-muted)', 
                                  padding: activeToggles.showAutoGroupDiversityPercentages ? '0.2rem 0.5rem' : '0.2rem 0', 
                                  borderRadius: '6px',
                                  display: 'inline-block'
                                }}
                              >
                                {activeToggles.showAutoGroupDiversityPercentages ? `${group.diversityScore}%` : '—'}
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
                                      data-student-id={student.id}
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
                                        aria-label={isPinned ? "Unlock student" : "Pin student"}
                                      >
                                        <Pin size={11} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                      </button>
                                      <button
                                        type="button"
                                        draggable={false}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInitiateSwap(student.id);
                                        }}
                                        className={`autogroup-swap-btn ${swappingStudentId === student.id ? 'active' : ''}`}
                                        style={{
                                          background: swappingStudentId === student.id ? 'var(--primary-light)' : 'none',
                                          border: 'none',
                                          padding: '0.1rem',
                                          cursor: 'pointer',
                                          color: swappingStudentId === student.id ? 'var(--primary)' : 'var(--text-muted)',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                        title={
                                          swappingStudentId === student.id
                                            ? "Cancel swap"
                                            : swappingStudentId
                                              ? "Swap with selected teammate"
                                              : getShortcutTooltip("Swap teammate", "swap_teammate")
                                        }
                                        aria-label="Swap teammate"
                                      >
                                        <ArrowRightLeft size={10} />
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
                    const isTeamFullyLocked = group.students.length > 0 && group.students.every(s => pinnedStudentIds.has(s.id));
                    const isDragOver = dragOverGroupId === `compact-${group.groupName}`;

                    return (
                      <div
                        key={group.groupName}
                        data-group-name={group.groupName}
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
                            <button
                              type="button"
                              className={`p-1 rounded-md transition-all ${isTeamFullyLocked ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLockTeam(group.students);
                              }}
                              title={isTeamFullyLocked ? `Unlock all students in ${group.groupName}` : `Lock all students in ${group.groupName}`}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                            >
                              {isTeamFullyLocked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} />}
                            </button>
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
                          {activeToggles.showAutoGroupDiversityPercentages && (
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
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {filteredMembers.map(student => {
                            const isPinned = pinnedStudentIds.has(student.id);
                            const isDraggingThis = draggedStudentId === student.id;

                            return (
                            <div
                              key={student.id}
                              data-student-id={student.id}
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
                              onClick={() => {
                                if (swappingStudentId) {
                                  if (swappingStudentId === student.id) {
                                    setSwappingStudentId(null);
                                  } else {
                                    handleSwapStudents(swappingStudentId, student.id);
                                    setSwappingStudentId(null);
                                  }
                                  return;
                                }
                                setSelectedStudent(student);
                              }}
                              className={`autogroup-draggable-item ${isDraggingThis ? 'is-being-dragged' : ''} ${swappingStudentId === student.id ? 'is-swapping-active' : ''}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.25rem 0.4rem',
                                backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-app)',
                                border: isPinned ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {student.nationality || student.gender || ''}
                                </span>
                                <button
                                  type="button"
                                  draggable={false}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInitiateSwap(student.id);
                                  }}
                                  className={`autogroup-swap-btn ${swappingStudentId === student.id ? 'active' : ''}`}
                                  style={{
                                    background: swappingStudentId === student.id ? 'var(--primary-light)' : 'none',
                                    border: 'none',
                                    padding: '0.1rem',
                                    cursor: 'pointer',
                                    color: swappingStudentId === student.id ? 'var(--primary)' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title={
                                    swappingStudentId === student.id
                                      ? "Cancel swap"
                                      : swappingStudentId
                                        ? "Swap with selected teammate"
                                        : getShortcutTooltip("Swap teammate", "swap_teammate")
                                  }
                                  aria-label="Swap teammate"
                                >
                                  <ArrowRightLeft size={10} />
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
                                  title={isPinned ? "Student locked. Click to unlock." : "Pin student"}
                                  aria-label={isPinned ? "Unlock student" : "Pin student"}
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
                    const isTeamFullyLocked = group.students.length > 0 && group.students.every(s => pinnedStudentIds.has(s.id));
                    const sim = simulationReports ? simulationReports[group.groupName] : null;
                    const isDragOver = dragOverGroupId === `grid-${group.groupName}`;

                    return (
                      <div
                        id={`grid-team-card-${group.groupName}`}
                        key={group.groupName}
                        data-group-name={group.groupName}
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
                          backgroundColor: isDragOver ? 'rgba(13, 148, 136, 0.08)' : transferringStudentId && transferringStudent?.groupName !== group.groupName ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-surface)',
                          border: isDragOver ? '2px dashed var(--accent-teal)' : transferringStudentId && transferringStudent?.groupName !== group.groupName ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem',
                          boxShadow: isDragOver ? '0 0 0 4px rgba(13, 148, 136, 0.18)' : transferringStudentId && transferringStudent?.groupName !== group.groupName ? '0 0 0 2px var(--primary-glow)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                          cursor: transferringStudentId && transferringStudent?.groupName !== group.groupName ? 'pointer' : 'default',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Group Header */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className={`p-1 rounded-md transition-all ${isTeamFullyLocked ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLockTeam(group.students);
                                }}
                                title={isTeamFullyLocked ? `Unlock all students in ${group.groupName}` : `Lock all students in ${group.groupName}`}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                {isTeamFullyLocked ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
                              </button>
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
                                  fontWeight: 800,
                                  flexShrink: 0
                                }}
                              >
                                <Users size={13} />
                              </div>
                              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                {group.groupName}
                              </span>
                              {transferringStudentId && transferringStudent?.groupName !== group.groupName && (
                                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.12rem 0.4rem', borderRadius: '4px' }}>
                                  Click to move here
                                </span>
                              )}
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.12rem 0.4rem', flexShrink: 0 }}>
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
                                    fontWeight: 700,
                                    flexShrink: 0
                                  }}
                                  title={`${pinnedInGroup} student${pinnedInGroup > 1 ? 's' : ''} locked to this team`}
                                >
                                  <Pin size={10} style={{ transform: 'rotate(45deg)' }} /> {pinnedInGroup}
                                </span>
                              )}
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
                              {activeToggles.showAutoGroupDiversityPercentages && (
                                <span 
                                  style={{ 
                                    fontSize: '0.82rem', 
                                    fontWeight: 800, 
                                    color: group.diversityScore >= 80 ? '#0d9488' : 'var(--primary)',
                                    backgroundColor: 'var(--primary-light)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    animation: 'fadeIn 0.2s ease'
                                  }}
                                  title={`Team overall diversity score: ${group.diversityScore}%`}
                                >
                                  {group.diversityScore}%
                                </span>
                              )}
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

                          {/* Clean Informative Team Composition Summary (Hidden by default, modularly toggleable) */}
                          {activeToggles.showAutoGroupTeamComposition && group.students.length > 0 && (() => {
                            const distinctNatCount = new Set(group.students.map(s => s.nationality).filter(Boolean)).size;
                            const distinctUniCount = new Set(group.students.map(s => s.university).filter(Boolean)).size;
                            const femaleCount = group.students.filter(s => s.gender === 'Female').length;
                            const maleCount = group.students.filter(s => s.gender === 'Male').length;
                            const otherGenderCount = group.students.length - femaleCount - maleCount;
                            const genderStr = [
                              femaleCount > 0 ? `${femaleCount}F` : null,
                              maleCount > 0 ? `${maleCount}M` : null,
                              otherGenderCount > 0 ? `${otherGenderCount} Other` : null
                            ].filter(Boolean).join(' • ');

                            return (
                              <div style={{
                                padding: '0.35rem 0.85rem',
                                backgroundColor: 'var(--bg-app)',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                fontSize: '0.68rem',
                                color: 'var(--text-secondary)',
                                flexWrap: 'wrap'
                              }}>
                                {distinctNatCount > 0 && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Globe size={10} style={{ opacity: 0.75 }} />
                                    <span>{distinctNatCount} {distinctNatCount === 1 ? 'Country' : 'Countries'}</span>
                                  </span>
                                )}
                                {distinctUniCount > 0 && (
                                  <>
                                    <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <GraduationCap size={10} style={{ opacity: 0.75 }} />
                                      <span>{distinctUniCount} {distinctUniCount === 1 ? 'Uni' : 'Unis'}</span>
                                    </span>
                                  </>
                                )}
                                {genderStr && (
                                  <>
                                    <span style={{ color: 'var(--border-color)', userSelect: 'none' }}>•</span>
                                    <span>{genderStr}</span>
                                  </>
                                )}
                              </div>
                            );
                          })()}

                          {/* Minimal & Well-Organized Diversity Metric Strip (Hidden by default, modularly toggleable) */}
                          {activeToggles.showAutoGroupDiversityStrip && group.ruleSatisfactions && group.ruleSatisfactions.length > 0 && (
                            <div className="autogroup-diversity-strip" style={{ animation: 'fadeIn 0.2s ease' }}>
                              {group.ruleSatisfactions.slice(0, 3).map((rs, idx) => {
                                const shortName = rs.ruleName.split(' ')[0];
                                const isHigh = rs.satisfactionScore >= 80;
                                const isMid = rs.satisfactionScore >= 60;
                                const scoreColor = isHigh ? '#10b981' : isMid ? '#f59e0b' : 'var(--accent-rose, #ef4444)';
                                const dotColor = isHigh ? '#10b981' : isMid ? '#f59e0b' : '#ef4444';

                                return (
                                  <React.Fragment key={rs.ruleId}>
                                    {idx > 0 && (
                                      <div className="autogroup-diversity-divider" />
                                    )}
                                    <div 
                                      className="autogroup-diversity-item"
                                      title={rs.summary ? `${rs.ruleName}: ${rs.summary} (${rs.satisfactionScore}%)` : `${rs.ruleName}: ${rs.satisfactionScore}%`}
                                    >
                                      <span 
                                        className="autogroup-diversity-dot" 
                                        style={{ backgroundColor: dotColor }} 
                                      />
                                      <span className="autogroup-diversity-label">
                                        {shortName}
                                      </span>
                                      <strong 
                                        className="autogroup-diversity-score" 
                                        style={{ color: scoreColor }}
                                      >
                                        {rs.satisfactionScore}%
                                      </strong>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          )}
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
                                  data-student-id={student.id}
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
                                  onClick={() => {
                                    if (transferringStudentId) {
                                      if (transferringStudentId !== student.id) {
                                        handleMoveStudent(transferringStudentId, group.groupName);
                                        setTransferringStudentId(null);
                                        return;
                                      }
                                    }
                                    if (swappingStudentId) {
                                      if (swappingStudentId === student.id) {
                                        setSwappingStudentId(null);
                                      } else {
                                        handleSwapStudents(swappingStudentId, student.id);
                                        setSwappingStudentId(null);
                                      }
                                      return;
                                    }
                                    setSelectedStudent(student);
                                  }}
                                  className={`autogroup-draggable-item ${isDraggingThis ? 'is-being-dragged' : ''} ${swappingStudentId === student.id ? 'is-swapping-active' : ''}`}
                                  style={{
                                    padding: '0.52rem 0.7rem',
                                    backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-app)',
                                    border: isPinned ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.35rem',
                                    fontSize: '0.76rem',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    boxShadow: isPinned ? '0 1px 4px rgba(245, 158, 11, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease'
                                  }}
                                >
                                  {/* Top Row: Grip, Avatar, Name & Uni, Action Controls */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                                      <GripVertical size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />
                                      <div style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%', 
                                        backgroundColor: isPinned ? 'rgba(245, 158, 11, 0.18)' : 'var(--primary-light)', 
                                        color: isPinned ? '#d97706' : 'var(--primary)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '0.68rem', 
                                        fontWeight: 800, 
                                        flexShrink: 0 
                                      }}>
                                        {student.name.charAt(0)}
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                          <span 
                                            style={{ 
                                              fontWeight: 750, 
                                              color: 'var(--text-primary)', 
                                              overflow: 'hidden', 
                                              textOverflow: 'ellipsis', 
                                              whiteSpace: 'nowrap', 
                                              fontSize: '0.82rem' 
                                            }}
                                            title={student.name}
                                          >
                                            {student.name}
                                          </span>
                                          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', fontSize: '0.69rem', color: 'var(--text-muted)' }}>
                                            {renderStudentUniText(student)}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Actions: Clean Reassign & Lock */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                                        {/* Send to Another Group Popover Button */}
                                        <button
                                            type="button"
                                            draggable={false}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSwappingStudentId(null);
                                              setTransferringStudentId(prev => prev === student.id ? null : student.id);
                                            }}
                                            className={`autogroup-send-btn ${transferringStudentId === student.id ? 'active' : ''}`}
                                            title={transferringStudentId === student.id ? `Cancel transfer of ${student.name}` : `Transfer ${student.name} to another team (click here, then click destination team)`}
                                            aria-label={`Transfer ${student.name} to another team`}
                                            style={{ width: '24px', height: '24px' }}
                                          >
                                            <Send size={12} style={{ transform: 'translateX(-1px)' }} />
                                          </button>

                                        {/* Instant 2-Click Swap Teammate Button */}
                                        <button
                                          type="button"
                                          draggable={false}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleInitiateSwap(student.id);
                                          }}
                                          style={{
                                            width: '23px',
                                            height: '23px',
                                            background: swappingStudentId === student.id ? 'var(--primary-light)' : 'none',
                                            border: swappingStudentId === student.id ? '1px solid var(--primary)' : '1px solid transparent',
                                            borderRadius: '5px',
                                            padding: 0,
                                            cursor: 'pointer',
                                            color: swappingStudentId === student.id ? 'var(--primary)' : 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s ease'
                                          }}
                                          title={
                                            swappingStudentId === student.id
                                              ? "Cancel swap (or press Esc)"
                                              : swappingStudentId
                                                ? "Swap with selected teammate"
                                                : getShortcutTooltip("Swap teammate", "swap_teammate")
                                          }
                                          aria-label="Swap teammate"
                                        >
                                          <ArrowRightLeft size={11} />
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
                                            width: '23px',
                                            height: '23px',
                                            background: isPinned ? 'rgba(245, 158, 11, 0.15)' : 'none',
                                            border: isPinned ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                                            borderRadius: '5px',
                                            padding: 0,
                                            cursor: 'pointer',
                                            color: isPinned ? '#d97706' : 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s ease'
                                          }}
                                          title={isPinned ? "Student is locked in team. Click to unlock." : "Lock student in team"}
                                          aria-label={isPinned ? "Unlock student" : "Lock student in team"}
                                        >
                                          <Pin size={11} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)' }} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Bottom Row: Demographics Chips - Dot-Separated Clean Row (Modularly toggleable) */}
                                    {activeToggles.showAutoGroupStudentDemographics && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '29px', flexWrap: 'wrap', fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                                      {student.nationality && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)', fontWeight: 550 }}>
                                          <Globe size={10} style={{ opacity: 0.75, flexShrink: 0 }} />
                                          <span>{student.nationality}</span>
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
                                          <span style={{ color: 'var(--primary)', fontWeight: 650 }}>
                                            {student.role}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    )}
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
            <EditableModuleSlot
              moduleKey="showAutoGroupBottomBar"
              isEditMode={isEditMode}
              isVisible={activeToggles.showAutoGroupBottomBar}
              onToggle={handleToggle}
              slotType="bar"
            >
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
                  <EditableModuleSlot
                    moduleKey="showAutoGroupShuffleBtn"
                    isEditMode={isEditMode}
                    isVisible={activeToggles.showAutoGroupShuffleBtn}
                    onToggle={handleToggle}
                    slotType="button"
                    inline
                  >
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
                  </EditableModuleSlot>

                  {onOpenTeamCharter && (
                    <EditableModuleSlot
                      moduleKey="showAutoGroupCharterBtn"
                      isEditMode={isEditMode}
                      isVisible={activeToggles.showAutoGroupCharterBtn}
                      onToggle={handleToggle}
                      slotType="button"
                      inline
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => onOpenTeamCharter(groupingResult?.updatedStudents)}
                          style={{ padding: '0.55rem 1.15rem', fontSize: '0.84rem', fontWeight: 700, borderColor: 'var(--primary)', color: 'var(--primary)', backgroundColor: 'var(--bg-surface)' }}
                          title="Generate Team Collaboration Agreements, assign customizable activity roles, and tailored 5-min multicultural icebreakers"
                        >
                          <Sparkles size={14} /> Team Agreements &amp; Roles
                        </button>
                        <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', paddingLeft: '0.2rem' }}>
                          Roles, icebreakers &amp; norms
                        </span>
                      </div>
                    </EditableModuleSlot>
                  )}

                  <EditableModuleSlot
                    moduleKey="showAutoGroupApplyBtn"
                    isEditMode={isEditMode}
                    isVisible={activeToggles.showAutoGroupApplyBtn}
                    onToggle={handleToggle}
                    slotType="button"
                    inline
                  >
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
                  </EditableModuleSlot>
                </div>
              </div>
            </EditableModuleSlot>
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

      {/* ── Floating "Unassigned Students" Quick Drawer / Dock ────────────────── */}
      {effectiveExpanded && (unassignedStudents.length > 0 || isUnassignedDockOpen) && typeof document !== 'undefined' && createPortal(
        <div className="floating-unassigned-dock">
          {!isUnassignedDockOpen ? (
            <button
              type="button"
              onClick={() => {
                if (transferringStudentId) {
                  handleMoveStudent(transferringStudentId, 'Unassigned');
                  setTransferringStudentId(null);
                  return;
                }
                setIsUnassignedDockOpen(true);
              }}
              className="floating-unassigned-pill-trigger"
              title={getShortcutTooltip(`Unassigned Students (${unassignedStudents.length})`, "toggle_unassigned_dock")}
              aria-label="Expand unassigned students dock"
            >
              <UserX size={14} style={{ color: unassignedStudents.length > 0 ? 'var(--accent-rose, #e11d48)' : 'var(--text-muted)' }} />
              <span style={{
                fontSize: '0.66rem',
                padding: '0.08rem 0.35rem',
                borderRadius: '10px',
                backgroundColor: unassignedStudents.length > 0 ? 'rgba(225, 29, 72, 0.12)' : 'var(--border-color)',
                color: unassignedStudents.length > 0 ? 'var(--accent-rose, #e11d48)' : 'var(--text-muted)',
                fontWeight: 800
              }}>
                {unassignedStudents.length}
              </span>
            </button>
          ) : (
            <div 
              className="floating-unassigned-panel"
              onClick={(e) => {
                if (transferringStudentId) {
                  e.stopPropagation();
                  handleMoveStudent(transferringStudentId, 'Unassigned');
                  setTransferringStudentId(null);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const studentId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                if (studentId) {
                  handleMoveStudent(studentId, 'Unassigned');
                }
                setDraggedStudentId(null);
                setDragOverGroupId(null);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserX size={14} style={{ color: unassignedStudents.length > 0 ? 'var(--accent-rose, #e11d48)' : 'var(--accent-teal)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {unassignedStudents.length}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {unassignedStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoDistributeUnassigned}
                      className="btn btn-sm btn-secondary"
                      style={{
                        width: '24px',
                        height: '24px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '5px'
                      }}
                      title="Auto-distribute unassigned students to teams with fewest members"
                      aria-label="Auto-distribute unassigned students"
                    >
                      <Shuffle size={12} className="text-teal" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsUnassignedDockOpen(false)}
                    className="btn btn-sm btn-secondary"
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '5px'
                    }}
                    title={getShortcutTooltip("Minimize drawer", "toggle_unassigned_dock")}
                    aria-label="Minimize drawer"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {unassignedStudents.length === 0 ? (
                <div style={{
                  padding: '1.25rem 0.75rem',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '1.5px dashed var(--border-color)',
                  backgroundColor: 'var(--bg-subtle, rgba(0,0,0,0.02))',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.72rem'
                }}>
                  <UserCheck size={18} style={{ color: 'var(--accent-teal, #0d9488)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>All students assigned to teams</span>
                  <span style={{ fontSize: '0.66rem', opacity: 0.8 }}>Drop student here to unassign</span>
                </div>
              ) : (

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                maxHeight: '210px',
                overflowY: 'auto',
                paddingRight: '0.2rem'
              }}>
                {unassignedStudents.map(student => {
                  const isDraggingThis = draggedStudentId === student.id;
                  return (
                    <div
                      key={`unassigned-${student.id}`}
                      data-student-id={student.id}
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
                      onClick={() => {
                        if (swappingStudentId) {
                          if (swappingStudentId === student.id) {
                            setSwappingStudentId(null);
                          } else {
                            handleSwapStudents(swappingStudentId, student.id);
                            setSwappingStudentId(null);
                          }
                          return;
                        }
                        setSelectedStudent(student);
                      }}
                      className={`unassigned-student-chip ${isDraggingThis ? 'is-being-dragged' : ''} ${swappingStudentId === student.id ? 'is-swapping-active' : ''}`}
                      title="Drag to team or click to inspect"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flex: 1 }}>
                        <GripVertical size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(225, 29, 72, 0.12)',
                          color: 'var(--accent-rose, #e11d48)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {student.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {student.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiateSwap(student.id);
                          }}
                          className={`autogroup-swap-btn ${swappingStudentId === student.id ? 'active' : ''}`}
                          style={{
                            background: swappingStudentId === student.id ? 'var(--primary-light)' : 'none',
                            border: 'none',
                            padding: '0.1rem',
                            cursor: 'pointer',
                            color: swappingStudentId === student.id ? 'var(--primary)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={
                            swappingStudentId === student.id
                              ? "Cancel swap"
                              : swappingStudentId
                                ? "Swap with selected student"
                                : getShortcutTooltip("Swap teammate", "swap_teammate")
                          }
                          aria-label="Swap teammate"
                        >
                          <ArrowRightLeft size={11} />
                        </button>
                        {groupingResult && groupingResult.groups.length > 0 && (
                          <button
                              type="button"
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSwappingStudentId(null);
                                setTransferringStudentId(prev => prev === student.id ? null : student.id);
                              }}
                              className={`autogroup-send-btn ${transferringStudentId === student.id ? 'active' : ''}`}
                              title={transferringStudentId === student.id ? `Cancel transfer of ${student.name}` : `Assign ${student.name} to a team (click here, then click destination team)`}
                              aria-label={`Assign ${student.name} to a team`}
                              style={{ width: '22px', height: '22px' }}
                            >
                              <Send size={11} style={{ transform: 'translateX(-1px)' }} />
                            </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}

    </div>
  );
};

export default AutoGroupStudio;
