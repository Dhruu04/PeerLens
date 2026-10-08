import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Printer,
  FileText,
  Sliders,
  Check,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Clock,
  Target,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import type { Student, ClassData, TeamCharterRole } from '../utils/math';
import { DEFAULT_TEAM_ROLES, DEFAULT_CUSTOM_ICEBREAKERS, type CustomIcebreakerTask } from '../utils/math';
import { useClass } from '../context/ClassContext';

interface TeamKickoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  onSaveStudents: (updatedStudents: Student[]) => void;
  initialTab?: 'roles_config' | 'icebreakers' | 'charters';
  autoPrint?: boolean;
}

const DEFAULT_CUSTOM_ROLES: TeamCharterRole[] = DEFAULT_TEAM_ROLES;

const DEFAULT_WORKING_NORMS: string[] = [
  'Respond to team chat messages within 12-24 business hours',
  'Arrive on time to group sessions with tasks pre-read and prepared',
  'Raise blockers transparently during weekly sync before deadlines',
  'Ensure equal contribution expectation across all project milestones'
];

const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#0d9488', // Teal
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#64748b'  // Slate
];

const STORAGE_KEY_ROLES = 'peer_custom_charter_roles_v1';
const STORAGE_KEY_ICEBREAKERS = 'peer_custom_icebreakers_v1';
const STORAGE_KEY_NORMS = 'peer_custom_working_norms_v1';

export const TeamKickoffModal: React.FC<TeamKickoffModalProps> = ({
  isOpen,
  onClose,
  classData,
  onSaveStudents,
  initialTab,
  autoPrint
}) => {
  // Group students by team
  const teamsMap = useMemo(() => {
    const map: Record<string, Student[]> = {};
    classData.students.forEach(s => {
      const g = s.groupName || 'Unassigned';
      if (!map[g]) map[g] = [];
      map[g].push(s);
    });
    return map;
  }, [classData.students]);

  const { updateTeamCharterConfig } = useClass();

  const teamNames = useMemo(() => {
    return Object.keys(teamsMap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [teamsMap]);

  // 1. Custom Roles State (with localStorage persistence)
  const [customRoles, setCustomRoles] = useState<TeamCharterRole[]>(() => {
    if (classData.teamCharterConfig?.customRoles && classData.teamCharterConfig.customRoles.length > 0) {
      return classData.teamCharterConfig.customRoles;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load custom roles from storage', e);
    }
    return DEFAULT_CUSTOM_ROLES;
  });

  // Active Role IDs selected for the current activity
  const [activeRoleIds, setActiveRoleIds] = useState<string[]>(() => {
    return customRoles.map(r => r.id);
  });

  // 2. Custom Icebreaker Tasks State (with localStorage persistence)
  const [customIcebreakers, setCustomIcebreakers] = useState<CustomIcebreakerTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ICEBREAKERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load custom icebreakers from storage', e);
    }
    return DEFAULT_CUSTOM_ICEBREAKERS;
  });

  const [selectedIcebreakerId, setSelectedIcebreakerId] = useState<string>(() => {
    return customIcebreakers[0]?.id || 'ice_multicultural';
  });

  // 3. Custom Working Norms State (with localStorage persistence)
  const [customNorms, setCustomNorms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NORMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load custom norms from storage', e);
    }
    return DEFAULT_WORKING_NORMS;
  });

  // Student Role Assignments state: studentId -> roleTitle
  const [studentRoles, setStudentRoles] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    classData.students.forEach(s => {
      if (s.role) init[s.id] = s.role;
    });
    return init;
  });

  // Keep studentRoles in sync whenever students update (e.g. self-selected by student in portal)
  useEffect(() => {
    const init: Record<string, string> = {};
    classData.students.forEach(s => {
      if (s.role) init[s.id] = s.role;
    });
    setStudentRoles(init);
  }, [classData.students]);

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<'roles_config' | 'icebreakers' | 'charters'>(initialTab || 'roles_config');
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>('all');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  // Sync active tab when initialTab prop changes upon opening
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle auto-print if requested
  useEffect(() => {
    if (isOpen && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  // Editing state for roles
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<TeamCharterRole>({
    id: '',
    title: '',
    color: '#3b82f6',
    description: '',
    responsibilities: []
  });
  const [newRespInput, setNewRespInput] = useState<string>('');

  // Editing state for icebreakers
  const [editingIcebreakerId, setEditingIcebreakerId] = useState<string | null>(null);
  const [icebreakerForm, setIcebreakerForm] = useState<CustomIcebreakerTask>({
    id: '',
    title: '',
    duration: '5 Minutes',
    prompt: '',
    outcome: ''
  });

  // New norm input
  const [newNormInput, setNewNormInput] = useState<string>('');

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(customRoles));
    } catch (e) {
      console.warn('Failed to persist roles', e);
    }
  }, [customRoles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ICEBREAKERS, JSON.stringify(customIcebreakers));
    } catch (e) {
      console.warn('Failed to persist icebreakers', e);
    }
  }, [customIcebreakers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NORMS, JSON.stringify(customNorms));
    } catch (e) {
      console.warn('Failed to persist norms', e);
    }
  }, [customNorms]);

  // Sync all custom roles, active roles, icebreaker tasks, active topic, and team norms to classData in real-time
  useEffect(() => {
    updateTeamCharterConfig(classData.id, {
      customRoles,
      selectedRoleIds: activeRoleIds,
      customIcebreakers,
      selectedIcebreakerId,
      teamNorms: customNorms
    });
  }, [classData.id, customRoles, activeRoleIds, customIcebreakers, selectedIcebreakerId, customNorms]);

  // Filtered active roles
  const activeRolesList = useMemo(() => {
    return customRoles.filter(r => activeRoleIds.includes(r.id));
  }, [customRoles, activeRoleIds]);

  // Toggle role inclusion
  const handleToggleRoleInclusion = (roleId: string) => {
    if (activeRoleIds.includes(roleId)) {
      if (activeRoleIds.length <= 1) return; // Keep at least 1 role active
      setActiveRoleIds(activeRoleIds.filter(id => id !== roleId));
    } else {
      setActiveRoleIds([...activeRoleIds, roleId]);
    }
  };

  // --- ROLE ACTIONS ---
  const handleStartAddRole = () => {
    const newId = `role_${Date.now()}`;
    setRoleForm({
      id: newId,
      title: 'New Custom Role',
      color: COLOR_PALETTE[customRoles.length % COLOR_PALETTE.length],
      description: 'Describe what this team role is responsible for.',
      responsibilities: ['Key deliverable', 'Core activity task']
    });
    setEditingRoleId(newId);
  };

  const handleStartEditRole = (role: TeamCharterRole) => {
    setRoleForm({ ...role, responsibilities: [...role.responsibilities] });
    setEditingRoleId(role.id);
  };

  const handleSaveRoleForm = () => {
    if (!roleForm.title.trim()) return;
    const exists = customRoles.some(r => r.id === roleForm.id);
    if (exists) {
      setCustomRoles(customRoles.map(r => r.id === roleForm.id ? roleForm : r));
    } else {
      setCustomRoles([...customRoles, roleForm]);
      if (!activeRoleIds.includes(roleForm.id)) {
        setActiveRoleIds([...activeRoleIds, roleForm.id]);
      }
    }
    setEditingRoleId(null);
  };

  const handleDeleteRole = (roleId: string) => {
    if (customRoles.length <= 1) return;
    setCustomRoles(customRoles.filter(r => r.id !== roleId));
    setActiveRoleIds(activeRoleIds.filter(id => id !== roleId));
    if (editingRoleId === roleId) setEditingRoleId(null);
  };

  const handleAddResponsibility = () => {
    if (!newRespInput.trim()) return;
    setRoleForm({
      ...roleForm,
      responsibilities: [...roleForm.responsibilities, newRespInput.trim()]
    });
    setNewRespInput('');
  };

  const handleRemoveResponsibility = (idx: number) => {
    setRoleForm({
      ...roleForm,
      responsibilities: roleForm.responsibilities.filter((_, i) => i !== idx)
    });
  };

  const handleResetRolesToDefault = () => {
    setCustomRoles(DEFAULT_CUSTOM_ROLES);
    setActiveRoleIds(DEFAULT_CUSTOM_ROLES.map(r => r.id));
    setEditingRoleId(null);
  };

  // --- ICEBREAKER ACTIONS ---
  const handleStartAddIcebreaker = () => {
    const newId = `ice_${Date.now()}`;
    setIcebreakerForm({
      id: newId,
      title: 'Custom Team Kickoff Activity',
      duration: '5 Minutes',
      prompt: 'Describe the custom icebreaker challenge or question for this activity.',
      outcome: 'What psychological safety, rapport, or clarity does this activity build?'
    });
    setEditingIcebreakerId(newId);
  };

  const handleStartEditIcebreaker = (ice: CustomIcebreakerTask) => {
    setIcebreakerForm({ ...ice });
    setEditingIcebreakerId(ice.id);
  };

  const handleSaveIcebreakerForm = () => {
    if (!icebreakerForm.title.trim()) return;
    const exists = customIcebreakers.some(i => i.id === icebreakerForm.id);
    if (exists) {
      setCustomIcebreakers(customIcebreakers.map(i => i.id === icebreakerForm.id ? icebreakerForm : i));
    } else {
      setCustomIcebreakers([...customIcebreakers, icebreakerForm]);
      setSelectedIcebreakerId(icebreakerForm.id);
    }
    setEditingIcebreakerId(null);
  };

  const handleDeleteIcebreaker = (iceId: string) => {
    if (customIcebreakers.length <= 1) return;
    const updated = customIcebreakers.filter(i => i.id !== iceId);
    setCustomIcebreakers(updated);
    if (selectedIcebreakerId === iceId) {
      setSelectedIcebreakerId(updated[0].id);
    }
    if (editingIcebreakerId === iceId) setEditingIcebreakerId(null);
  };

  const handleResetIcebreakersToDefault = () => {
    setCustomIcebreakers(DEFAULT_CUSTOM_ICEBREAKERS);
    setSelectedIcebreakerId(DEFAULT_CUSTOM_ICEBREAKERS[0].id);
    setEditingIcebreakerId(null);
  };

  // --- NORMS ACTIONS ---
  const handleAddNorm = () => {
    if (!newNormInput.trim()) return;
    setCustomNorms([...customNorms, newNormInput.trim()]);
    setNewNormInput('');
  };

  const handleDeleteNorm = (index: number) => {
    setCustomNorms(customNorms.filter((_, i) => i !== index));
  };

  const handleResetNormsToDefault = () => {
    setCustomNorms(DEFAULT_WORKING_NORMS);
  };

  // --- AUTO-ALLOCATE ROLES ---
  const handleAutoAllocateRoles = () => {
    if (activeRolesList.length === 0) return;
    const newRoles: Record<string, string> = {};

    teamNames.forEach(tName => {
      const members = teamsMap[tName];
      if (!members || members.length === 0) return;

      members.forEach((student, memberIdx) => {
        const role = activeRolesList[memberIdx % activeRolesList.length];
        newRoles[student.id] = role.title;
      });
    });

    setStudentRoles(newRoles);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // --- APPLY ROLES TO CLASS ---
  const handleApplyRolesToClass = () => {
    const updated = classData.students.map(s => {
      return {
        ...s,
        role: studentRoles[s.id] || undefined
      };
    });
    onSaveStudents(updated);
    updateTeamCharterConfig(classData.id, {
      customRoles,
      selectedRoleIds: activeRoleIds,
      teamNorms: customNorms
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const activeIcebreaker = useMemo(() => {
    return customIcebreakers.find(i => i.id === selectedIcebreakerId) || customIcebreakers[0];
  }, [customIcebreakers, selectedIcebreakerId]);

  // Interpolate dynamic tokens if user included them in their custom prompt
  const formatPromptForTeam = (prompt: string, teamName: string, members: Student[]) => {
    const nationalities = Array.from(new Set(members.map(m => m.nationality).filter(Boolean)));
    const degrees = Array.from(new Set(members.map(m => m.degree).filter(Boolean)));

    return prompt
      .replace(/{teamName}/g, teamName)
      .replace(/{memberCount}/g, String(members.length))
      .replace(/{nationalities}/g, nationalities.join(', ') || 'Global backgrounds')
      .replace(/{degrees}/g, degrees.join(', ') || 'Diverse disciplines');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Minimal Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Team Charter &amp; Roles Studio
                </h3>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                  Customizable
                </span>
              </div>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Customize activity roles, kickoff icebreaker prompts, and team working agreements.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.35rem', fontSize: '0.76rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
              title="Print all generated Team Charter Kickoff Cards"
            >
              <Printer size={13} /> Print Charters
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Streamlined Segmented Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Minimal Segmented Pill Tabs */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('roles_config')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.8rem',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'roles_config' ? 750 : 600,
                color: activeTab === 'roles_config' ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'roles_config' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Sliders size={13} />
              <span>Roles ({activeRolesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('icebreakers')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.8rem',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'icebreakers' ? 750 : 600,
                color: activeTab === 'icebreakers' ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'icebreakers' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={13} />
              <span>Icebreakers ({customIcebreakers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('charters')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.8rem',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'charters' ? 750 : 600,
                color: activeTab === 'charters' ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === 'charters' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={13} />
              <span>Team Charters ({teamNames.length})</span>
            </button>
          </div>

          {/* Quick Context Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isSavedNotice && (
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-teal)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} /> Saved!
              </span>
            )}
            <button
              type="button"
              onClick={handleAutoAllocateRoles}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.3rem', fontSize: '0.74rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
              title="Automatically allocate active roles to team members"
            >
              <Sparkles size={12} style={{ color: 'var(--primary)' }} />
              <span>Auto-Allocate Roles</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          
          {/* ─────────────────────────────────────────────────────────────────────────
              TAB 1: CUSTOM ROLES MANAGER
             ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'roles_config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Activity Roles
                  </h4>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Toggle roles to include or exclude them from team allocation. Click any card to edit.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResetRolesToDefault}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.3rem', fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                    title="Reset to default starter roles"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAddRole}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.3rem', fontSize: '0.74rem', fontWeight: 700, padding: '0.3rem 0.75rem' }}
                  >
                    <Plus size={12} /> Add Role
                  </button>
                </div>
              </div>

              {/* Role Edit/Add Drawer Card (When editing) */}
              {editingRoleId && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '12px',
                    border: '1.5px solid var(--primary)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Edit2 size={13} /> Edit Role Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingRoleId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Role Title
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={roleForm.title}
                        onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })}
                        placeholder="e.g. Lead Developer, Scrum Master, Strategy Consultant..."
                        style={{ fontSize: '0.8rem', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Theme Color
                      </label>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap', paddingTop: '2px' }}>
                        {COLOR_PALETTE.map(c => (
                          <div
                            key={c}
                            onClick={() => setRoleForm({ ...roleForm, color: c })}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: c,
                              cursor: 'pointer',
                              border: roleForm.color === c ? '2px solid #ffffff' : 'none',
                              outline: roleForm.color === c ? `2px solid ${c}` : 'none',
                              transition: 'transform 0.1s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      Role Description &amp; Scope
                    </label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      placeholder="Describe what this role is responsible for in the team..."
                      style={{ fontSize: '0.76rem', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      Core Tasks &amp; Responsibilities
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={newRespInput}
                        onChange={(e) => setNewRespInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddResponsibility(); } }}
                        placeholder="Type a task and press Enter..."
                        style={{ fontSize: '0.76rem', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleAddResponsibility}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 700, fontSize: '0.72rem' }}
                      >
                        <Plus size={11} /> Add
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {roleForm.responsibilities.map((resp, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {resp}
                          <X
                            size={10}
                            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                            onClick={() => handleRemoveResponsibility(idx)}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingRoleId(null)}
                      style={{ fontSize: '0.74rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveRoleForm}
                      style={{ fontWeight: 800, fontSize: '0.74rem' }}
                    >
                      <Check size={12} /> Save Role
                    </button>
                  </div>
                </div>
              )}

              {/* Roles Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.75rem' }}>
                {customRoles.map(role => {
                  const isChecked = activeRoleIds.includes(role.id);
                  const isBeingEdited = editingRoleId === role.id;

                  return (
                    <div
                      key={role.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: isBeingEdited
                          ? '1.5px solid var(--primary)'
                          : isChecked
                            ? `1px solid ${role.color}40`
                            : '1px solid var(--border-color)',
                        backgroundColor: isChecked ? `${role.color}06` : 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: 'var(--shadow-xs)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div
                          onClick={() => handleToggleRoleInclusion(role.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              border: isChecked ? `1.5px solid ${role.color}` : '1.5px solid var(--border-color)',
                              backgroundColor: isChecked ? role.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              flexShrink: 0
                            }}
                          >
                            {isChecked && <Check size={10} />}
                          </div>
                          <span style={{ fontSize: '0.84rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                            {role.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditRole(role)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Edit this role"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role.id)}
                            disabled={customRoles.length <= 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: customRoles.length <= 1 ? 'var(--border-color)' : 'var(--text-muted)',
                              cursor: customRoles.length <= 1 ? 'not-allowed' : 'pointer',
                              padding: '0.2rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete this role"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {role.description}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 'auto', paddingTop: '0.2rem' }}>
                        {role.responsibilities.map((resp, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.66rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {resp}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Working Norms & Agreement Editor */}
              <div
                style={{
                  marginTop: '0.35rem',
                  padding: '1rem 1.15rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Team Working Agreement &amp; Norms
                    </h4>
                    <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Default ground rules printed on each team charter.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetNormsToDefault}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                  >
                    <RotateCcw size={10} /> Reset Norms
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={newNormInput}
                    onChange={(e) => setNewNormInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNorm(); } }}
                    placeholder="Type a new team norm and press Enter..."
                    style={{ fontSize: '0.76rem', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNorm}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 700, fontSize: '0.72rem' }}
                  >
                    <Plus size={11} /> Add Rule
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.4rem' }}>
                  {customNorms.map((norm, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.4rem 0.6rem',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        color: 'var(--text-primary)',
                        gap: '0.4rem'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Check size={11} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{norm}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNorm(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────
              TAB 2: CUSTOM ICEBREAKER TASKS MANAGER
             ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'icebreakers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Kickoff Icebreaker Activities
                  </h4>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Select the active prompt for team charters, or customize new prompts.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResetIcebreakersToDefault}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.3rem', fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                    title="Reset to default icebreaker prompts"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAddIcebreaker}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.3rem', fontSize: '0.74rem', fontWeight: 700, padding: '0.3rem 0.75rem' }}
                  >
                    <Plus size={12} /> Add Activity
                  </button>
                </div>
              </div>

              {/* Icebreaker Edit Form (When editing) */}
              {editingIcebreakerId && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: '12px',
                    border: '1.5px solid var(--primary)',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Edit2 size={13} /> Edit Icebreaker Challenge
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingIcebreakerId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Activity Title
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={icebreakerForm.title}
                        onChange={(e) => setIcebreakerForm({ ...icebreakerForm, title: e.target.value })}
                        placeholder="e.g. Cross-Cultural Passport Exchange..."
                        style={{ fontSize: '0.8rem', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Duration
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={icebreakerForm.duration}
                        onChange={(e) => setIcebreakerForm({ ...icebreakerForm, duration: e.target.value })}
                        placeholder="e.g. 5 Minutes, 10 Minutes..."
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      Instructions &amp; Prompts (Placeholders: &#123;teamName&#125;, &#123;memberCount&#125;, &#123;nationalities&#125;, &#123;degrees&#125;)
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={icebreakerForm.prompt}
                      onChange={(e) => setIcebreakerForm({ ...icebreakerForm, prompt: e.target.value })}
                      placeholder="Each member shares..."
                      style={{ fontSize: '0.76rem', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                      Expected Outcome &amp; Value
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={icebreakerForm.outcome}
                      onChange={(e) => setIcebreakerForm({ ...icebreakerForm, outcome: e.target.value })}
                      placeholder="e.g. Builds psychological safety, surfaces latent technical strengths..."
                      style={{ fontSize: '0.76rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingIcebreakerId(null)}
                      style={{ fontSize: '0.74rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveIcebreakerForm}
                      style={{ fontWeight: 800, fontSize: '0.74rem' }}
                    >
                      <Check size={12} /> Save Icebreaker
                    </button>
                  </div>
                </div>
              )}

              {/* Icebreaker Cards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {customIcebreakers.map(ice => {
                  const isSelected = selectedIcebreakerId === ice.id;
                  const isBeingEdited = editingIcebreakerId === ice.id;

                  return (
                    <div
                      key={ice.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: isBeingEdited
                          ? '1.5px solid var(--primary)'
                          : isSelected
                            ? '1.5px solid var(--primary)'
                            : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.03)' : 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        boxShadow: isSelected ? '0 2px 10px rgba(99, 102, 241, 0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div
                          onClick={() => setSelectedIcebreakerId(ice.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}
                        >
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {isSelected && (
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                              {ice.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-app)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                              <Clock size={10} /> {ice.duration}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditIcebreaker(ice)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Edit this icebreaker"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIcebreaker(ice.id)}
                            disabled={customIcebreakers.length <= 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: customIcebreakers.length <= 1 ? 'var(--border-color)' : 'var(--text-muted)',
                              cursor: customIcebreakers.length <= 1 ? 'not-allowed' : 'pointer',
                              padding: '0.2rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Delete this icebreaker"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '0.55rem 0.75rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        <strong>Prompt:</strong> {ice.prompt}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <Target size={11} className="text-teal" />
                        <span><strong>Outcome:</strong> {ice.outcome}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────────────
              TAB 3: TEAM CHARTERS & KICKOFF CARDS
             ───────────────────────────────────────────────────────────────────────── */}
          {activeTab === 'charters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Filter and Overview bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Filter Team:
                  </span>
                  <select
                    value={activeTeamFilter}
                    onChange={(e) => setActiveTeamFilter(e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem', height: '30px' }}
                  >
                    <option value="all">All Teams ({teamNames.length})</option>
                    {teamNames.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Active Icebreaker: <strong>{activeIcebreaker.title}</strong>
                  </span>
                </div>
              </div>

              {/* Grid of Team Charter Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                {teamNames
                  .filter(tName => activeTeamFilter === 'all' || activeTeamFilter === tName)
                  .map(tName => {
                    const members = teamsMap[tName] || [];
                    const formattedPrompt = formatPromptForTeam(activeIcebreaker.prompt, tName, members);

                    return (
                      <div
                        key={tName}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        {/* Team Charter Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                              <Users size={12} />
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {tName}
                            </span>
                          </div>
                          <span className="badge badge-secondary" style={{ fontSize: '0.66rem', padding: '0.1rem 0.4rem' }}>
                            {members.length} Members
                          </span>
                        </div>

                        {/* Members with Assigned Roles Dropdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Team Member Roles
                          </span>
                          {members.map(student => {
                            const assignedRole = studentRoles[student.id] || 'Unassigned';
                            const roleObj = activeRolesList.find(r => r.title === assignedRole);

                            return (
                              <div
                                key={student.id}
                                style={{
                                  padding: '0.4rem 0.6rem',
                                  backgroundColor: 'var(--bg-app)',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.45rem'
                                }}
                              >
                                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {student.name}
                                  </span>
                                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                                    {student.degree || student.nationality || 'Student'}
                                  </span>
                                </div>

                                <select
                                  value={assignedRole}
                                  onChange={(e) => setStudentRoles({ ...studentRoles, [student.id]: e.target.value })}
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '4px',
                                    border: roleObj ? `1px solid ${roleObj.color}` : '1px solid var(--border-color)',
                                    backgroundColor: roleObj ? `${roleObj.color}15` : 'var(--bg-surface)',
                                    color: roleObj ? roleObj.color : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    maxWidth: '140px'
                                  }}
                                >
                                  <option value="Unassigned">Role: Unassigned</option>
                                  {activeRolesList.map(r => (
                                    <option key={r.id} value={r.title}>{r.title}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>

                        {/* Customized Icebreaker Prompt Section */}
                        <div
                          style={{
                            padding: '0.55rem 0.65rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(99, 102, 241, 0.04)',
                            border: '1px solid rgba(99, 102, 241, 0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 750, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={10} /> {activeIcebreaker.title} ({activeIcebreaker.duration})
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {formattedPrompt}
                          </p>
                        </div>

                        {/* Working Agreement Norms */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.45rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 750, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Working Agreements
                          </span>
                          {customNorms.slice(0, 3).map((norm, nIdx) => (
                            <span key={nIdx} style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Check size={9} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} /> {norm}
                            </span>
                          ))}
                        </div>

                      </div>
                    );
                  })}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Classroom: <strong>{classData.name}</strong> • <strong>{classData.students.length} Students</strong> across <strong>{teamNames.length} Teams</strong>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ fontSize: '0.76rem' }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApplyRolesToClass}
              style={{ fontWeight: 800, fontSize: '0.76rem' }}
            >
              <Check size={13} /> Save &amp; Apply to Class Roster
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeamKickoffModal;
