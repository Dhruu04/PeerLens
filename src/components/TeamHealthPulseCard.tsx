import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Activity,
  Plus,
  QrCode,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Play,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Download,
  Eye,
  Search,
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X
} from 'lucide-react';
import type {
  ClassData,
  PulseRound,
  PulseScaleType,
  PulseConfig,
  PulseResponse,
  PulseCustomQuestion
} from '../utils/math';
import {
  calculateTeamPulseMetrics,
  PULSE_SCALE_PRESETS
} from '../utils/math';
import { StudentPulseModal } from './StudentPulseModal';
import Modal from './Modal';
import FeatureInfoButton from './FeatureInfoButton';

interface TeamHealthPulseCardProps {
  activeClass: ClassData;
  onCreateRound: (classId: string, roundData: { title: string; config?: Partial<PulseConfig> }) => void;
  onUpdateRound: (classId: string, roundId: string, updates: Partial<PulseRound>) => void;
  onSubmitResponse: (classId: string, roundId: string, response: Omit<PulseResponse, 'id' | 'submittedAt'>) => void;
  onDeleteRound: (classId: string, roundId: string) => void;
  onSeedSampleData: (classId: string) => void;
  addToast: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const TeamHealthPulseCard: React.FC<TeamHealthPulseCardProps> = ({
  activeClass,
  onCreateRound,
  onUpdateRound,
  onSubmitResponse,
  onDeleteRound,
  onSeedSampleData,
  addToast
}) => {
  const [isCardExpanded, setIsCardExpanded] = useState<boolean>(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  // Master Collapse / Expand listener
  useEffect(() => {
    const handleCollapse = () => setIsCardExpanded(false);
    const handleExpand = () => setIsCardExpanded(true);
    window.addEventListener('peerlens_collapse_all', handleCollapse);
    window.addEventListener('peerlens_expand_all', handleExpand);
    return () => {
      window.removeEventListener('peerlens_collapse_all', handleCollapse);
      window.removeEventListener('peerlens_expand_all', handleExpand);
    };
  }, []);
  
  // Modals state
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isResponsesModalOpen, setIsResponsesModalOpen] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Responses viewer filters
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // New Round Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newScaleType, setNewScaleType] = useState<PulseScaleType>('stars_5');
  const [newMoralePrompt, setNewMoralePrompt] = useState<string>('Team Morale & Communication');
  const [newProgressPrompt, setNewProgressPrompt] = useState<string>('Is your team on track for this milestone?');
  const [newNotePrompt, setNewNotePrompt] = useState<string>('Describe any blockers or dependencies (optional)');
  const [newAllowNotes, setNewAllowNotes] = useState<boolean>(true);
  const [newCustomQuestions, setNewCustomQuestions] = useState<PulseCustomQuestion[]>([]);

  // Edit Config State
  const [editScaleType, setEditScaleType] = useState<PulseScaleType>('stars_5');
  const [editMoralePrompt, setEditMoralePrompt] = useState<string>('');
  const [editProgressPrompt, setEditProgressPrompt] = useState<string>('');
  const [editNotePrompt, setEditNotePrompt] = useState<string>('');
  const [editCustomQuestions, setEditCustomQuestions] = useState<PulseCustomQuestion[]>([]);

  const rounds = useMemo(() => activeClass.pulseRounds || [], [activeClass.pulseRounds]);
  
  // Current active or chosen round
  const currentRound = useMemo(() => {
    if (selectedRoundId) {
      const found = rounds.find(r => r.id === selectedRoundId);
      if (found) return found;
    }
    return rounds.find(r => r.status === 'active') || rounds[rounds.length - 1] || null;
  }, [rounds, selectedRoundId]);

  // Compute metrics
  const pulseMetrics = useMemo(() => {
    return calculateTeamPulseMetrics(activeClass, currentRound?.id);
  }, [activeClass, currentRound]);

  // Unique team list for filtering
  const teamList = useMemo(() => {
    const set = new Set<string>();
    activeClass.students.forEach(s => {
      if (s.groupName) set.add(s.groupName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [activeClass.students]);

  // Matrix Table Sorting & Filtering states
  const [tableSortField, setTableSortField] = useState<'teamName' | 'membersResponded' | 'currentMorale' | 'milestoneStatus' | 'blockers'>('teamName');
  const [tableSortDirection, setTableSortDirection] = useState<'asc' | 'desc'>('asc');
  const [tableFilterStatus, setTableFilterStatus] = useState<'all' | 'needs_attention' | 'pending' | 'on_track'>('all');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  const handleToggleTableSort = (field: 'teamName' | 'membersResponded' | 'currentMorale' | 'milestoneStatus' | 'blockers') => {
    if (tableSortField === field) {
      setTableSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDirection(field === 'teamName' ? 'asc' : 'desc');
    }
  };

  const teamStatusCounts = useMemo(() => {
    let needsAttention = 0;
    let pending = 0;
    let onTrack = 0;

    pulseMetrics.teamSummaries.forEach(ts => {
      if (ts.dominantStatus === 'blocked' || ts.dominantStatus === 'minor_roadblock' || ts.blockerNotes.length > 0) {
        needsAttention++;
      }
      if (ts.responseCount < ts.memberCount) {
        pending++;
      }
      if (ts.dominantStatus === 'on_track' && ts.responseCount > 0) {
        onTrack++;
      }
    });

    return {
      all: pulseMetrics.teamSummaries.length,
      needsAttention,
      pending,
      onTrack
    };
  }, [pulseMetrics.teamSummaries]);

  const sortedAndFilteredTeamSummaries = useMemo(() => {
    let list = [...pulseMetrics.teamSummaries];

    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.trim().toLowerCase();
      list = list.filter(ts =>
        ts.teamName.toLowerCase().includes(q) ||
        ts.blockerNotes.some(bn => bn.note.toLowerCase().includes(q) || bn.studentName.toLowerCase().includes(q))
      );
    }

    if (tableFilterStatus === 'needs_attention') {
      list = list.filter(ts => ts.dominantStatus === 'blocked' || ts.dominantStatus === 'minor_roadblock' || ts.blockerNotes.length > 0);
    } else if (tableFilterStatus === 'pending') {
      list = list.filter(ts => ts.responseCount < ts.memberCount);
    } else if (tableFilterStatus === 'on_track') {
      list = list.filter(ts => ts.dominantStatus === 'on_track' && ts.responseCount > 0);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (tableSortField) {
        case 'teamName':
          cmp = a.teamName.localeCompare(b.teamName, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'membersResponded': {
          const rateA = a.memberCount > 0 ? a.responseCount / a.memberCount : 0;
          const rateB = b.memberCount > 0 ? b.responseCount / b.memberCount : 0;
          cmp = rateA - rateB || a.responseCount - b.responseCount;
          break;
        }
        case 'currentMorale':
          cmp = a.averageMorale - b.averageMorale;
          break;
        case 'milestoneStatus': {
          const score = (status: string, respCount: number) => {
            if (status === 'blocked') return 4;
            if (status === 'minor_roadblock') return 3;
            if (respCount === 0) return 2;
            return 1;
          };
          cmp = score(a.dominantStatus, a.responseCount) - score(b.dominantStatus, b.responseCount);
          break;
        }
        case 'blockers':
          cmp = a.blockerNotes.length - b.blockerNotes.length;
          break;
        default:
          cmp = a.teamName.localeCompare(b.teamName, undefined, { numeric: true, sensitivity: 'base' });
      }
      return tableSortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [pulseMetrics.teamSummaries, tableSearchQuery, tableFilterStatus, tableSortField, tableSortDirection]);

  // Filtered responses for current round
  const filteredResponses = useMemo(() => {
    if (!currentRound) return [];
    return currentRound.responses.filter(resp => {
      if (filterTeam !== 'all' && resp.groupName !== filterTeam) return false;
      if (filterStatus !== 'all' && resp.status !== filterStatus) return false;
      if (searchStudent.trim()) {
        const query = searchStudent.toLowerCase();
        if (!resp.studentName.toLowerCase().includes(query) && !(resp.blockerNote || '').toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [currentRound, filterTeam, filterStatus, searchStudent]);

  // CSV Data Downloader
  const handleExportCSV = (targetRound?: PulseRound | null) => {
    const rToExport = targetRound || currentRound;
    if (!rToExport) {
      addToast('No pulse round selected to export.', 'warning');
      return;
    }

    const headers = [
      'Round Title',
      'Status',
      'Student Name',
      'Team Name',
      'Morale Rating (1-5)',
      'Scale Type',
      'Milestone Status',
      'Blocker Note',
      'Submitted At',
      'Custom Answers'
    ];

    const rows: string[][] = [];

    if (rToExport.responses.length === 0) {
      rows.push([
        `"${rToExport.title.replace(/"/g, '""')}"`,
        rToExport.status,
        'No responses yet',
        '',
        '',
        rToExport.config?.scaleType || 'stars_5',
        '',
        '',
        '',
        ''
      ]);
    } else {
      rToExport.responses.forEach(resp => {
        const customFormatted = resp.customAnswers
          ? Object.entries(resp.customAnswers).map(([k, v]) => `${k}: ${v}`).join('; ')
          : '';
        rows.push([
          `"${rToExport.title.replace(/"/g, '""')}"`,
          rToExport.status,
          `"${resp.studentName.replace(/"/g, '""')}"`,
          `"${resp.groupName.replace(/"/g, '""')}"`,
          String(resp.moraleScore),
          resp.scaleType,
          resp.status,
          `"${(resp.blockerNote || '').replace(/"/g, '""')}"`,
          new Date(resp.submittedAt).toLocaleString(),
          `"${customFormatted.replace(/"/g, '""')}"`
        ]);
      });
    }

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = rToExport.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `${activeClass.name.replace(/\s+/g, '_')}_${safeTitle}_Pulse_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Downloaded pulse responses CSV successfully!', 'success');
  };

  // Custom question builder helpers
  const handleAddQuestion = (isEdit: boolean) => {
    const newQ: PulseCustomQuestion = {
      id: `q_${Date.now()}`,
      title: '',
      type: 'scale',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      required: false
    };
    if (isEdit) {
      setEditCustomQuestions(prev => [...prev, newQ]);
    } else {
      setNewCustomQuestions(prev => [...prev, newQ]);
    }
  };

  const handleUpdateQuestion = (isEdit: boolean, id: string, updates: Partial<PulseCustomQuestion>) => {
    const updater = (prev: PulseCustomQuestion[]) =>
      prev.map(q => (q.id === id ? { ...q, ...updates } : q));
    if (isEdit) {
      setEditCustomQuestions(updater);
    } else {
      setNewCustomQuestions(updater);
    }
  };

  const handleRemoveQuestion = (isEdit: boolean, id: string) => {
    if (isEdit) {
      setEditCustomQuestions(prev => prev.filter(q => q.id !== id));
    } else {
      setNewCustomQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  // Handle opening share modal with QR
  const handleOpenShare = async () => {
    if (!currentRound) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?classId=${activeClass.id}&pulseId=${currentRound.id}`;
    try {
      const url = await QRCode.toDataURL(shareUrl, { width: 280, margin: 1 });
      setQrDataUrl(url);
      setIsShareModalOpen(true);
    } catch (e) {
      console.error(e);
      addToast('Failed to generate QR code.', 'error');
    }
  };

  // Preset switch in Launch modal
  const handleSelectScaleType = (type: PulseScaleType) => {
    setNewScaleType(type);
    const preset = PULSE_SCALE_PRESETS[type];
    if (preset) {
      setNewMoralePrompt(preset.promptDefault);
    }
  };

  // Launch new round
  const handleLaunchRound = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRound(activeClass.id, {
      title: newTitle.trim() || `Sprint Check #${rounds.length + 1}`,
      config: {
        scaleType: newScaleType,
        moralePrompt: newMoralePrompt.trim() || 'Team Morale & Communication',
        progressPrompt: newProgressPrompt.trim() || 'Is your team on track for this milestone?',
        notePrompt: newNotePrompt.trim() || 'Describe any blockers or dependencies (optional)',
        allowBlockerNotes: newAllowNotes,
        customQuestions: newCustomQuestions.filter(q => q.title.trim()).length > 0
          ? newCustomQuestions.filter(q => q.title.trim())
          : undefined,
        scaleOptions: PULSE_SCALE_PRESETS[newScaleType]?.options
      }
    });
    setIsLaunchModalOpen(false);
    setNewTitle('');
    setNewCustomQuestions([]);
  };

  // Save edited config
  const handleSaveConfig = () => {
    if (!currentRound) return;
    onUpdateRound(activeClass.id, currentRound.id, {
      config: {
        ...currentRound.config,
        scaleType: editScaleType,
        moralePrompt: editMoralePrompt,
        progressPrompt: editProgressPrompt,
        notePrompt: editNotePrompt,
        customQuestions: editCustomQuestions.filter(q => q.title.trim()).length > 0
          ? editCustomQuestions.filter(q => q.title.trim())
          : undefined,
        scaleOptions: PULSE_SCALE_PRESETS[editScaleType]?.options
      }
    });
    setIsConfigModalOpen(false);
    addToast('Pulse check-in configuration saved.', 'success');
  };

  return (
    <div
      className="card"
      style={{
        padding: isCardExpanded ? '1.25rem' : '0.85rem 1.25rem',
        transition: 'padding 0.2s ease',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-surface)'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: isCardExpanded ? '1.25rem' : 0
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setIsCardExpanded(!isCardExpanded)}
          title={isCardExpanded ? 'Click to collapse card' : 'Click to expand card'}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Activity size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                Team Health "Micro-Pulse" Check-ins
                <FeatureInfoButton featureId="team-health-pulse" size="sm" tooltipText="Team Health Micro-Pulse Guide" />
              </h3>

              {currentRound && (
                <span className={`badge ${currentRound.status === 'active' ? 'badge-teal' : 'badge-secondary'}`} style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  {currentRound.status === 'active' ? 'Active Collection' : 'Closed Round'}
                </span>
              )}

              {pulseMetrics.teamsBlockedCount > 0 && (
                <span className="badge badge-amber" style={{ fontSize: '0.7rem', fontWeight: 700, gap: '0.25rem' }}>
                  <AlertTriangle size={11} /> {pulseMetrics.teamsBlockedCount} Blocked
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              On-demand 30-second pulse surveys tracking team morale, communication, and project blockers with live sparklines.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Launch New Pulse Button */}
          <button
            type="button"
            className="btn btn-teal btn-sm"
            onClick={() => {
              setNewTitle(`Milestone Health Check #${rounds.length + 1}`);
              setIsLaunchModalOpen(true);
            }}
            style={{ height: '34px', fontSize: '0.78rem', fontWeight: 700, gap: '0.35rem', borderRadius: '8px' }}
            title="Launch a new on-demand team health pulse round"
          >
            <Plus size={14} /> Launch Pulse Check
          </button>

          {currentRound && (
            <>
              {/* View Individual Responses */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilterTeam('all');
                  setFilterStatus('all');
                  setSearchStudent('');
                  setIsResponsesModalOpen(true);
                }}
                style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.35rem', borderRadius: '8px' }}
                title="View all individual student responses, blockers, and custom answers"
              >
                <Eye size={13} className="text-teal" /> View Responses ({currentRound.responses.length})
              </button>

              {/* Export CSV Data */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleExportCSV(currentRound)}
                style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.35rem', borderRadius: '8px' }}
                title="Export all individual pulse check-in responses to CSV spreadsheet"
              >
                <Download size={13} className="text-indigo" /> Export Data
              </button>

              {/* Scale & Questions Customizer */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditScaleType(currentRound.config?.scaleType || 'stars_5');
                  setEditMoralePrompt(currentRound.config?.moralePrompt || 'Team Morale & Communication');
                  setEditProgressPrompt(currentRound.config?.progressPrompt || 'Is your team on track for this milestone?');
                  setEditNotePrompt(currentRound.config?.notePrompt || 'Describe any blockers or dependencies (optional)');
                  setEditCustomQuestions(currentRound.config?.customQuestions || []);
                  setIsConfigModalOpen(true);
                }}
                style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.35rem', borderRadius: '8px' }}
                title="Customize scale style (Stars, Likert, Traffic Light, Icons, Slider) and add custom questions"
              >
                <Sliders size={13} /> Customize Scale & Questions
              </button>

              {/* Share QR / Link */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleOpenShare}
                style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.35rem', borderRadius: '8px' }}
                title="Share 30-second student survey link or QR code"
              >
                <QrCode size={14} /> Share QR / Link
              </button>

              {/* Student Portal Preview */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsStudentModalOpen(true)}
                style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.35rem', borderRadius: '8px' }}
                title="Test student 30-second pulse portal form"
              >
                <Play size={13} className="text-teal" /> Test View
              </button>
            </>
          )}

          {/* Seed Sample Sprints if empty */}
          {rounds.length === 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onSeedSampleData(activeClass.id)}
              style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.35rem', borderRadius: '8px' }}
              title="Populate 3 sample multi-round sprints with realistic team health data"
            >
              <Sparkles size={13} className="text-indigo" /> Sample Data
            </button>
          )}

          {/* Expand / Collapse Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            style={{ height: '34px', fontSize: '0.78rem', fontWeight: 600, gap: '0.3rem', borderRadius: '8px' }}
            title={isCardExpanded ? 'Collapse card' : 'Expand card'}
          >
            {isCardExpanded ? (
              <>
                <ChevronUp size={14} /> Collapse
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Expand ({rounds.length} rounds)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body: Visible only when expanded */}
      {isCardExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Rounds Bar & Status Selector */}
          {rounds.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Pulse Round:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {rounds.map(r => {
                    const isSelected = currentRound?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRoundId(r.id)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: isSelected ? 800 : 600,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: r.status === 'active' ? '#10b981' : '#9ca3af' }} />
                        {r.title}
                        <span style={{ opacity: 0.7, fontSize: '0.68rem' }}>({r.responses.length})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentRound && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const newStatus = currentRound.status === 'active' ? 'closed' : 'active';
                      onUpdateRound(activeClass.id, currentRound.id, { status: newStatus });
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.6rem' }}
                  >
                    {currentRound.status === 'active' ? 'Close Round' : 'Reopen Round'}
                  </button>

                  {/* Delete Round */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete pulse round "${currentRound.title}"?`)) {
                        onDeleteRound(activeClass.id, currentRound.id);
                      }
                    }}
                    className="btn btn-secondary btn-sm text-rose"
                    style={{ fontSize: '0.72rem', height: '28px', padding: '0 0.5rem' }}
                    title="Delete this pulse check round"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State when no rounds exist */}
          {rounds.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '10px',
                border: '1px dashed var(--border-color)'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(20, 184, 166, 0.12)',
                  color: '#0d9488',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}
              >
                <Activity size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
                No Pulse Check-ins Created Yet
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 auto 1.25rem auto', maxWidth: '420px', lineHeight: 1.5 }}>
                Launch a 30-second pulse survey anytime during the term to track team morale and spot project blockers weeks before final deliverables.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-teal btn-sm"
                  onClick={() => {
                    setNewTitle('Sprint 1 Health Check');
                    setIsLaunchModalOpen(true);
                  }}
                  style={{ gap: '0.4rem', fontWeight: 700 }}
                >
                  <Plus size={14} /> Launch First Pulse Check
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSeedSampleData(activeClass.id)}
                  style={{ gap: '0.4rem' }}
                >
                  <Sparkles size={14} className="text-indigo" /> Load Sample 3-Round Sprints
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Class KPI Metric Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem' }}>
                {/* Morale Index */}
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Class Morale Index</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: pulseMetrics.classAverageMorale >= 3.5 ? '#10b981' : '#f59e0b' }}>
                      {pulseMetrics.classAverageMorale > 0 ? `${pulseMetrics.classAverageMorale} / 5.0` : '—'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      avg across teams
                    </span>
                  </div>
                </div>

                {/* On Track Rate */}
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Teams On Track</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10b981' }}>
                      {pulseMetrics.teamsOnTrackPercent}%
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      smooth delivery
                    </span>
                  </div>
                </div>

                {/* Blocked Teams Warning */}
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Blocked Teams</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: pulseMetrics.teamsBlockedCount > 0 ? '#ef4444' : '#10b981' }}>
                      {pulseMetrics.teamsBlockedCount}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {pulseMetrics.teamsBlockedCount > 0 ? 'needs intervention' : 'all clear'}
                    </span>
                  </div>
                </div>

                {/* Response Rate */}
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Response Participation</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--primary)' }}>
                      {pulseMetrics.totalSubmissions} / {pulseMetrics.totalStudentsExpected}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      ({pulseMetrics.totalStudentsExpected > 0 ? Math.round((pulseMetrics.totalSubmissions / pulseMetrics.totalStudentsExpected) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Toolbar: Search, Filters & Organization */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Search Bar */}
                <div style={{ position: 'relative', minWidth: '200px', flex: '1 1 200px', maxWidth: '300px' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Search teams or blockers..."
                    className="form-control"
                    style={{
                      paddingLeft: '2rem',
                      paddingRight: tableSearchQuery ? '2rem' : '0.75rem',
                      height: '32px',
                      fontSize: '0.78rem',
                      borderRadius: '6px'
                    }}
                  />
                  {tableSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTableSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
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
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setTableFilterStatus('all')}
                    className={`btn btn-sm ${tableFilterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.74rem',
                      height: '30px',
                      padding: '0 0.65rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>All Teams</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        backgroundColor: tableFilterStatus === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg-app)',
                        fontWeight: 800
                      }}
                    >
                      {teamStatusCounts.all}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTableFilterStatus('needs_attention')}
                    className={`btn btn-sm ${tableFilterStatus === 'needs_attention' ? 'btn-amber' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.74rem',
                      height: '30px',
                      padding: '0 0.65rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderColor: teamStatusCounts.needsAttention > 0 && tableFilterStatus !== 'needs_attention' ? 'rgba(239, 68, 68, 0.4)' : undefined
                    }}
                  >
                    <AlertTriangle size={12} className={teamStatusCounts.needsAttention > 0 ? 'text-amber' : ''} />
                    <span>Needs Attention</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        backgroundColor: teamStatusCounts.needsAttention > 0 ? '#ef4444' : 'var(--bg-app)',
                        color: teamStatusCounts.needsAttention > 0 ? '#fff' : 'inherit',
                        fontWeight: 800
                      }}
                    >
                      {teamStatusCounts.needsAttention}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTableFilterStatus('pending')}
                    className={`btn btn-sm ${tableFilterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.74rem',
                      height: '30px',
                      padding: '0 0.65rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>Pending Check-ins</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        backgroundColor: tableFilterStatus === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--bg-app)',
                        fontWeight: 800
                      }}
                    >
                      {teamStatusCounts.pending}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTableFilterStatus('on_track')}
                    className={`btn btn-sm ${tableFilterStatus === 'on_track' ? 'btn-teal' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.74rem',
                      height: '30px',
                      padding: '0 0.65rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>On Track</span>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        backgroundColor: tableFilterStatus === 'on_track' ? 'rgba(255,255,255,0.25)' : 'var(--bg-app)',
                        fontWeight: 800
                      }}
                    >
                      {teamStatusCounts.onTrack}
                    </span>
                  </button>

                  {(tableFilterStatus !== 'all' || tableSearchQuery.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTableFilterStatus('all');
                        setTableSearchQuery('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.72rem',
                        height: '30px',
                        padding: '0 0.55rem',
                        borderRadius: '6px',
                        color: 'var(--text-muted)'
                      }}
                      title="Clear filters"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Team Health Matrix Table with Sparklines */}
              <div className="table-container">
                <table className="custom-table" style={{ width: '100%', fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th
                        onClick={() => handleToggleTableSort('teamName')}
                        style={{ minWidth: '150px', cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by team name"
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Team Name</span>
                          {tableSortField === 'teamName' ? (
                            tableSortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleToggleTableSort('membersResponded')}
                        style={{ minWidth: '135px', cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by response rate"
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Members Responded</span>
                          {tableSortField === 'membersResponded' ? (
                            tableSortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleToggleTableSort('currentMorale')}
                        style={{ minWidth: '130px', cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by morale score"
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Current Morale</span>
                          {tableSortField === 'currentMorale' ? (
                            tableSortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>

                      <th
                        onClick={() => handleToggleTableSort('milestoneStatus')}
                        style={{ minWidth: '130px', cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by milestone health status"
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Milestone Status</span>
                          {tableSortField === 'milestoneStatus' ? (
                            tableSortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>

                      <th style={{ minWidth: '160px' }}>
                        <span>Health Trend (Past Sprints)</span>
                      </th>

                      <th
                        onClick={() => handleToggleTableSort('blockers')}
                        style={{ minWidth: '220px', cursor: 'pointer', userSelect: 'none' }}
                        title="Click to sort by blockers reported"
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>Recent Blocker Notes</span>
                          {tableSortField === 'blockers' ? (
                            tableSortDirection === 'asc' ? <ArrowUp size={13} className="text-primary" /> : <ArrowDown size={13} className="text-primary" />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredTeamSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                          <Filter size={22} style={{ margin: '0 auto 0.5rem', opacity: 0.45, display: 'block' }} />
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>No teams match your filter</div>
                          <div style={{ fontSize: '0.76rem', marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                            Try adjusting your search query or selecting a different status filter.
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setTableFilterStatus('all'); setTableSearchQuery(''); }}
                            style={{ marginTop: '0.85rem', fontSize: '0.74rem' }}
                          >
                            Reset Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredTeamSummaries.map(ts => {
                        const isBlocked = ts.dominantStatus === 'blocked';
                        const isWarning = ts.dominantStatus === 'minor_roadblock';

                        return (
                          <tr key={ts.teamName} style={{ backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                            {/* Team Name */}
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{ts.teamName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ts.memberCount} members</div>
                            </td>

                            {/* Response count */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 750, color: 'var(--text-primary)' }}>
                                  {ts.responseCount} / {ts.memberCount}
                                </span>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '5px',
                                    backgroundColor: 'var(--border-color)',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                  }}
                                  title={`${ts.memberCount > 0 ? Math.round((ts.responseCount / ts.memberCount) * 100) : 0}% response rate`}
                                >
                                  <div
                                    style={{
                                      width: `${ts.memberCount > 0 ? Math.round((ts.responseCount / ts.memberCount) * 100) : 0}%`,
                                      height: '100%',
                                      backgroundColor: ts.responseCount === ts.memberCount ? '#10b981' : ts.responseCount > 0 ? 'var(--primary)' : 'transparent',
                                      borderRadius: '3px',
                                      transition: 'width 0.25s ease'
                                    }}
                                  />
                                </div>
                              </div>
                              <div style={{ fontSize: '0.68rem', color: ts.responseCount === ts.memberCount ? '#10b981' : 'var(--text-muted)', marginTop: '0.1rem' }}>
                                {ts.memberCount > 0 ? Math.round((ts.responseCount / ts.memberCount) * 100) : 0}% check-in
                              </div>
                            </td>

                            {/* Morale score */}
                            <td>
                              {ts.responseCount === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.74rem' }}>Pending</span>
                              ) : (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, color: ts.averageMorale >= 4 ? '#10b981' : ts.averageMorale >= 3 ? '#f59e0b' : '#ef4444' }}>
                                    <span>{ts.averageMorale} / 5.0</span>
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    raw: {ts.rawAverageMorale} ({PULSE_SCALE_PRESETS[ts.scaleType]?.title.split(' ')[0]})
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td>
                              {ts.responseCount === 0 ? (
                                <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>Awaiting</span>
                              ) : isBlocked ? (
                                <span className="badge badge-amber" style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 800 }}>
                                  <AlertCircle size={12} /> Blocked
                                </span>
                              ) : isWarning ? (
                                <span className="badge badge-amber" style={{ gap: '0.25rem', fontSize: '0.72rem', fontWeight: 800 }}>
                                  <AlertTriangle size={12} /> Minor Roadblock
                                </span>
                              ) : (
                                <span className="badge badge-teal" style={{ gap: '0.25rem', fontSize: '0.72rem', fontWeight: 800 }}>
                                  <CheckCircle2 size={12} /> On Track
                                </span>
                              )}
                            </td>

                            {/* Sparkline Multi-Round Trend */}
                            <td>
                              {ts.sparkline.length === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>No history</span>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  {ts.sparkline.map((sp, sIdx) => {
                                    const color = sp.dominantStatus === 'blocked' ? '#ef4444' : sp.dominantStatus === 'minor_roadblock' ? '#f59e0b' : '#10b981';
                                    const heightPx = Math.max(10, Math.min(26, Math.round((sp.averageMorale / 5) * 26)));
                                    return (
                                      <div
                                        key={sIdx}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}
                                        title={`${sp.roundTitle}: ${sp.averageMorale}/5.0 (${sp.dominantStatus})`}
                                      >
                                        <div style={{ width: '14px', height: '26px', backgroundColor: 'var(--border-color)', borderRadius: '3px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                                          <div style={{ width: '100%', height: `${heightPx}px`, backgroundColor: color, transition: 'height 0.2s ease' }} />
                                        </div>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color }}>
                                          {sp.averageMorale}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Blocker Notes */}
                            <td>
                              {ts.blockerNotes.length === 0 ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>No blockers reported</span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '320px' }}>
                                  {ts.blockerNotes.map((bn, bIdx) => (
                                    <div
                                      key={bIdx}
                                      style={{
                                        fontSize: '0.72rem',
                                        padding: '0.3rem 0.5rem',
                                        borderRadius: '6px',
                                        backgroundColor: isBlocked ? '#fef2f2' : '#fffbeb',
                                        border: `1px solid ${isBlocked ? '#fecaca' : '#fde68a'}`,
                                        color: isBlocked ? '#991b1b' : '#92400e'
                                      }}
                                    >
                                      <strong>{bn.studentName}:</strong> "{bn.note}"
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: Launch New Pulse Round */}
      {isLaunchModalOpen && (
        <Modal isOpen={isLaunchModalOpen} onClose={() => setIsLaunchModalOpen(false)} title="Launch New Team Health Pulse Check" maxWidth="620px">
          <form onSubmit={handleLaunchRound} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Pulse Milestone / Round Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Sprint 2 Architecture Standup, Midterm Milestone Pulse..."
                className="form-input"
                required
                style={{ height: '38px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Scale Type Selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                  Select Reviewing Scale Style
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fully customizable</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                {(Object.keys(PULSE_SCALE_PRESETS) as PulseScaleType[]).map((type) => {
                  const p = PULSE_SCALE_PRESETS[type];
                  const isSelected = newScaleType === type;
                  return (
                    <div
                      key={type}
                      onClick={() => handleSelectScaleType(type)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '9px',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {p.title}
                        </span>
                        {isSelected && <Check size={14} style={{ color: 'var(--primary)' }} />}
                      </div>
                      <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                        {p.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prompt Customization */}
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Customize Question Prompts
              </span>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Question 1: Morale / Alignment Rating Prompt
                </label>
                <input
                  type="text"
                  value={newMoralePrompt}
                  onChange={(e) => setNewMoralePrompt(e.target.value)}
                  className="form-input"
                  style={{ height: '34px', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Question 2: Milestone Status Prompt
                </label>
                <input
                  type="text"
                  value={newProgressPrompt}
                  onChange={(e) => setNewProgressPrompt(e.target.value)}
                  className="form-input"
                  style={{ height: '34px', fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Question 3: Blocker / Dependency Notes Prompt
                  </label>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newAllowNotes}
                      onChange={(e) => setNewAllowNotes(e.target.checked)}
                    />
                    Enable blocker notes
                  </label>
                </div>
                <input
                  type="text"
                  value={newNotePrompt}
                  onChange={(e) => setNewNotePrompt(e.target.value)}
                  disabled={!newAllowNotes}
                  className="form-input"
                  style={{ height: '34px', fontSize: '0.8rem', opacity: newAllowNotes ? 1 : 0.6 }}
                />
              </div>
            </div>

            {/* Custom Question Builder for New Round */}
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Add Custom Questions ({newCustomQuestions.length})
                  </span>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    Optional additional questions (scale 1-5, multiple choice, or free text)
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddQuestion(false)}
                  style={{ fontSize: '0.72rem', height: '28px', gap: '0.3rem', borderRadius: '6px' }}
                >
                  <Plus size={12} /> Add Question
                </button>
              </div>

              {newCustomQuestions.map((q, idx) => (
                <div key={q.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Question #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(false, q.id)}
                      className="btn btn-secondary btn-sm text-rose"
                      style={{ height: '24px', padding: '0 0.4rem' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => handleUpdateQuestion(false, q.id, { title: e.target.value })}
                    placeholder="Enter question prompt (e.g. Is workload distributed fairly?)"
                    className="form-input"
                    style={{ height: '32px', fontSize: '0.78rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(false, q.id, { type: e.target.value as any })}
                      className="form-input"
                      style={{ height: '30px', fontSize: '0.74rem', width: '130px' }}
                    >
                      <option value="scale">Rating (1 to 5)</option>
                      <option value="choice">Multiple Choice</option>
                      <option value="text">Short Text</option>
                    </select>

                    {q.type === 'choice' && (
                      <input
                        type="text"
                        value={q.options?.join(', ') || ''}
                        onChange={(e) => handleUpdateQuestion(false, q.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="Comma-separated options (e.g. Yes, In-between, No)"
                        className="form-input"
                        style={{ height: '30px', fontSize: '0.74rem', flex: 1 }}
                      />
                    )}

                    <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(false, q.id, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsLaunchModalOpen(false)}
                style={{ fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-teal"
                style={{ fontSize: '0.82rem', fontWeight: 800, gap: '0.35rem' }}
              >
                <Play size={14} /> Launch Active Pulse
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Share QR & Direct Link */}
      {isShareModalOpen && currentRound && (
        <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share 30-Second Student Pulse Link" maxWidth="480px">
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
              Students can scan this QR code on their phone or click the direct URL to complete the 30-second check-in.
            </p>

            {qrDataUrl && (
              <div style={{ display: 'inline-block', padding: '0.75rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <img src={qrDataUrl} alt="Pulse Survey QR" style={{ width: '220px', height: '220px', display: 'block' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${window.location.pathname}?classId=${activeClass.id}&pulseId=${currentRound.id}`}
                className="form-input"
                style={{ height: '36px', fontSize: '0.78rem', backgroundColor: 'var(--bg-app)' }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?classId=${activeClass.id}&pulseId=${currentRound.id}`);
                  addToast('Copied direct pulse link to clipboard!', 'success');
                }}
                style={{ height: '36px', padding: '0 0.85rem', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700 }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Scale & Questions Customizer for Active Round */}
      {isConfigModalOpen && currentRound && (
        <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title={`Customize Scale & Questions: ${currentRound.title}`} maxWidth="620px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Active Reviewing Scale Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.45rem' }}>
                {(Object.keys(PULSE_SCALE_PRESETS) as PulseScaleType[]).map((type) => {
                  const p = PULSE_SCALE_PRESETS[type];
                  const isSelected = editScaleType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditScaleType(type)}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>{p.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{p.options.length} rating levels</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Morale & Synergy Prompt
              </label>
              <input
                type="text"
                value={editMoralePrompt}
                onChange={(e) => setEditMoralePrompt(e.target.value)}
                className="form-input"
                style={{ height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Milestone Delivery Status Prompt
              </label>
              <input
                type="text"
                value={editProgressPrompt}
                onChange={(e) => setEditProgressPrompt(e.target.value)}
                className="form-input"
                style={{ height: '36px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Custom Question Builder for Existing Round */}
            <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Custom Questions ({editCustomQuestions.length})
                  </span>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    Add or edit custom questions for this pulse check
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddQuestion(true)}
                  style={{ fontSize: '0.72rem', height: '28px', gap: '0.3rem', borderRadius: '6px' }}
                >
                  <Plus size={12} /> Add Question
                </button>
              </div>

              {editCustomQuestions.map((q, idx) => (
                <div key={q.id} style={{ backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Question #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(true, q.id)}
                      className="btn btn-secondary btn-sm text-rose"
                      style={{ height: '24px', padding: '0 0.4rem' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => handleUpdateQuestion(true, q.id, { title: e.target.value })}
                    placeholder="Enter question prompt (e.g. Is workload distributed fairly?)"
                    className="form-input"
                    style={{ height: '32px', fontSize: '0.78rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(true, q.id, { type: e.target.value as any })}
                      className="form-input"
                      style={{ height: '30px', fontSize: '0.74rem', width: '130px' }}
                    >
                      <option value="scale">Rating (1 to 5)</option>
                      <option value="choice">Multiple Choice</option>
                      <option value="text">Short Text</option>
                    </select>

                    {q.type === 'choice' && (
                      <input
                        type="text"
                        value={q.options?.join(', ') || ''}
                        onChange={(e) => handleUpdateQuestion(true, q.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="Comma-separated options (e.g. Yes, In-between, No)"
                        className="form-input"
                        style={{ height: '30px', fontSize: '0.74rem', flex: 1 }}
                      />
                    )}

                    <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(true, q.id, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConfigModalOpen(false)}
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-teal"
                onClick={handleSaveConfig}
                style={{ fontSize: '0.8rem', fontWeight: 800 }}
              >
                Save Scale Configuration
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: View Individual Student Responses */}
      {isResponsesModalOpen && currentRound && (
        <Modal
          isOpen={isResponsesModalOpen}
          onClose={() => setIsResponsesModalOpen(false)}
          title={`Student Responses: ${currentRound.title}`}
          maxWidth="840px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
            {/* Filter Bar & Export Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                {/* Team Filter */}
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.75rem', width: 'auto' }}
                >
                  <option value="all">All Teams ({teamList.length})</option>
                  {teamList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.75rem', width: 'auto' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="on_track">On Track</option>
                  <option value="minor_roadblock">Minor Roadblock</option>
                  <option value="blocked">Blocked</option>
                </select>

                {/* Search Input */}
                <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Search student or note..."
                    className="form-input"
                    style={{ height: '32px', fontSize: '0.75rem', paddingLeft: '26px' }}
                  />
                </div>
              </div>

              {/* Download CSV Button */}
              <button
                type="button"
                className="btn btn-teal btn-sm"
                onClick={() => handleExportCSV(currentRound)}
                style={{ height: '32px', fontSize: '0.75rem', gap: '0.35rem', fontWeight: 700 }}
              >
                <Download size={13} /> Export CSV Report
              </button>
            </div>

            {/* Responses Count & Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>
                Showing <b>{filteredResponses.length}</b> of {currentRound.responses.length} responses
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Scale: {PULSE_SCALE_PRESETS[currentRound.config?.scaleType || 'stars_5']?.title}
              </span>
            </div>

            {/* Responses List / Table */}
            {filteredResponses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: 'var(--bg-app)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {currentRound.responses.length === 0
                    ? 'No responses submitted yet for this pulse check.'
                    : 'No responses match your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '140px' }}>Student</th>
                      <th style={{ minWidth: '100px' }}>Team</th>
                      <th style={{ minWidth: '90px' }}>Morale</th>
                      <th style={{ minWidth: '120px' }}>Milestone Status</th>
                      <th style={{ minWidth: '180px' }}>Blocker Note / Feedback</th>
                      <th style={{ minWidth: '150px' }}>Custom Answers</th>
                      <th style={{ minWidth: '110px' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map((resp) => {
                      const isBlocked = resp.status === 'blocked';
                      const isWarning = resp.status === 'minor_roadblock';

                      return (
                        <tr key={resp.id} style={{ backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.04)' : undefined }}>
                          {/* Student Name */}
                          <td>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                              {resp.studentName}
                            </div>
                          </td>

                          {/* Team */}
                          <td>
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                              {resp.groupName}
                            </span>
                          </td>

                          {/* Morale */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 800, color: resp.moraleScore >= 4 ? '#10b981' : resp.moraleScore >= 3 ? '#f59e0b' : '#ef4444' }}>
                              <Star size={13} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                              <span>{resp.moraleScore}</span>
                            </div>
                          </td>

                          {/* Milestone Status */}
                          <td>
                            {isBlocked ? (
                              <span className="badge badge-amber" style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 800 }}>
                                <AlertCircle size={11} /> Blocked
                              </span>
                            ) : isWarning ? (
                              <span className="badge badge-amber" style={{ gap: '0.25rem', fontSize: '0.7rem', fontWeight: 800 }}>
                                <AlertTriangle size={11} /> Roadblock
                              </span>
                            ) : (
                              <span className="badge badge-teal" style={{ gap: '0.25rem', fontSize: '0.7rem', fontWeight: 800 }}>
                                <CheckCircle2 size={11} /> On Track
                              </span>
                            )}
                          </td>

                          {/* Blocker Note */}
                          <td>
                            {resp.blockerNote ? (
                              <div
                                style={{
                                  padding: '0.3rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  backgroundColor: isBlocked ? '#fef2f2' : 'var(--bg-app)',
                                  border: `1px solid ${isBlocked ? '#fecaca' : 'var(--border-color)'}`,
                                  color: isBlocked ? '#991b1b' : 'var(--text-primary)'
                                }}
                              >
                                "{resp.blockerNote}"
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic' }}>None</span>
                            )}
                          </td>

                          {/* Custom Answers */}
                          <td>
                            {resp.customAnswers && Object.keys(resp.customAnswers).length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '200px' }}>
                                {Object.entries(resp.customAnswers).map(([qId, val]) => (
                                  <div key={qId} style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                    <b>{qId}:</b> {String(val)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
                            )}
                          </td>

                          {/* Submitted Timestamp */}
                          <td>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {new Date(resp.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsResponsesModalOpen(false)}
                style={{ fontSize: '0.78rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: Interactive Student Pulse Modal Preview */}
      {isStudentModalOpen && currentRound && (
        <StudentPulseModal
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          activeClass={activeClass}
          activeRound={currentRound}
          onSubmitResponse={(roundId, resp) => {
            onSubmitResponse(activeClass.id, roundId, resp);
          }}
        />
      )}
    </div>
  );
};

export default TeamHealthPulseCard;
