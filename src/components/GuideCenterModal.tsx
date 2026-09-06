import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass, Search, Play, BookOpen, Sparkles, X, 
  Users, Sliders, Award, CheckCircle, HelpCircle,
  ChevronDown, ChevronUp, FileText, ArrowRight,
  LayoutGrid, Layers, Activity, Calculator,
  ExternalLink, Heart, Zap, ShieldCheck
} from 'lucide-react';
import { FEATURE_INFO_REGISTRY, type FeatureInfoItem } from '../data/featureDescriptions';

export interface GuidedTourTrack {
  id: string;
  title: string;
  category: string;
  stepCount: number;
  duration: string;
  description: string;
  icon: React.ReactNode;
  stepIds: string[];
  keyTopics: string[];
}

export const FOCUSED_TOUR_TRACKS: GuidedTourTrack[] = [
  {
    id: 'setup_density_track',
    title: 'Top Navigation & Interface Density Presets',
    category: 'Setup & Customization',
    stepCount: 6,
    duration: '40 sec',
    description: 'Master the top navigation bar, active classroom selector with embedded ID copy pill, "Customize View" button (add & remove sections), and density presets (Minimal vs Standard).',
    icon: <LayoutGrid size={18} className="text-primary" />,
    stepIds: ['class_header', 'customize_view', 'command_palette', 'guide_center_btn', 'settings_hub', 'workspace_switcher'],
    keyTopics: ['Classroom Selector & ID', 'Customize View (Add/Remove Sections)', 'Density Presets', 'Academic Guidance Center', 'Command Palette (Ctrl+K)']
  },
  {
    id: 'search_pill_dispute_track',
    title: 'Omni Search, Dispute Studio & Medical Exemptions',
    category: 'Productivity & Office Hours',
    stepCount: 4,
    duration: '45 sec',
    description: 'Master the universal Omni Search Bar with prefix filters (@students, #teams, >actions, ?help), side-by-side dossier peek, 1-click Medical Exemption WebPA factor neutralization, and the Student Grade Dispute Studio with 1-click response draft generator.',
    icon: <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />,
    stepIds: ['command_palette', 'quick_action_dock', 'gradebook_matrix', 'analytics_tab'],
    keyTopics: ['Omni Search (@, #, >, ?)', 'Split Dossier Peek', 'Excused Absence WebPA Neutralization (1.000)', 'Grade Dispute Studio & Draft Generator', 'Quick Action Floating Dock']
  },
  {
    id: 'enrollment_track',
    title: 'Section 1: Student Enrollment & AutoGroup Studio',
    category: 'Roster & Diversity',
    stepCount: 6,
    duration: '55 sec',
    description: 'Monitor Home Hub roster status, generate high-res QR join codes, populate 100 diverse demo students across 35+ countries, import spreadsheets, and run combinatorial simulated annealing team formation.',
    icon: <Users size={18} style={{ color: 'var(--primary)' }} />,
    stepIds: ['hub_enrollment', 'self_enrollment', 'quick_actions', 'import_wizard', 'autogroup_studio', 'classroom_roster'],
    keyTopics: ['Home Hub Section 1 Card', 'QR Mobile Onboarding', '100 Diverse Cohort', 'Excel/CSV Importer', 'AutoGroup Studio', 'Bulk Roster Actions']
  },
  {
    id: 'rubrics_track',
    title: 'Section 2: 100% Balanced Rubrics & Simulator',
    category: 'Rubrics & Scales',
    stepCount: 5,
    duration: '50 sec',
    description: 'Check Home Hub rubric health, configure multi-dimensional criteria, 100% weight auto-balancing, research-synthesized IPAF preset, target scale, and the mobile evaluation simulator.',
    icon: <Sliders size={18} style={{ color: 'var(--accent-amber)' }} />,
    stepIds: ['hub_review', 'rubric_tab', 'rubric_builder', 'target_scale', 'eval_simulator'],
    keyTopics: ['Home Hub Section 2 Card', '100% Weight Auto-Balance', 'IPAF Standard Preset', 'Target Scale Normalization', 'Student Experience Simulator']
  },
  {
    id: 'team_health_track',
    title: 'Section 2: Team Health Pulse & Evaluation Controls',
    category: 'Team Health & Governance',
    stepCount: 4,
    duration: '45 sec',
    description: 'Launch 30-second micro-pulse check-ins with 5 customizable scale presets, blocker alerts, and natural team sorting. Govern self-evaluations, praise badges across 6 dimensions, and profile edit locks.',
    icon: <Heart size={18} style={{ color: 'var(--accent-rose)' }} />,
    stepIds: ['rubric_tab', 'eval_controls', 'team_health_pulse', 'quick_action_dock'],
    keyTopics: ['30-Second Micro-Pulse Surveys', '5 Scale Presets (Likert, NPS, Performance, Traffic, Slider)', 'Blocker Alert Detection', 'Praise Badges & Qualitative Prompts', 'Quick Action Floating Dock']
  },
  {
    id: 'webpa_calibrator_track',
    title: 'Section 3: WebPA Calibrator & Master Gradebook',
    category: 'Grading & Multipliers',
    stepCount: 5,
    duration: '50 sec',
    description: 'Track Home Hub grade metrics, calibrate individual marks using the Loughborough WebPA algorithm with per-team base marks, tune the 0%–100% Fudge Weight slider, and export Excel workbooks or student PDF report cards.',
    icon: <Calculator size={18} style={{ color: 'var(--accent-teal)' }} />,
    stepIds: ['hub_analytics', 'analytics_tab', 'webpa_calibrator', 'results_summary', 'gradebook_matrix'],
    keyTopics: ['Home Hub Section 3 Card', 'Loughborough Algorithm', 'Per-Team Base Marks', '0%–100% Fudge Slider', 'Results Summary Sheet', 'Batch PDF Reports']
  },
  {
    id: 'perception_audit_track',
    title: 'Section 3: Perception Radar & Collusion Audit',
    category: 'Analytics & Integrity',
    stepCount: 3,
    duration: '40 sec',
    description: 'Explore Competency Spider Radars, Johari Window self-vs-peer blind spot detection (±7.5% threshold), and statistical collusion / retaliatory score audits.',
    icon: <Activity size={18} style={{ color: 'var(--accent-rose)' }} />,
    stepIds: ['analytics_tab', 'perception_deck', 'anomaly_audit'],
    keyTopics: ['Spider Radar Overlay', 'Johari Blind Spots', 'Reciprocal Collusion Rings', 'Outlier Grader Detection']
  }
];

export const FULL_APP_STEP_IDS = [
  'class_header', 'workspace_switcher', 'command_palette', 'guide_center_btn', 'projector_mode', 'email_dispatcher',
  'customize_view', 'settings_hub', 'quick_action_dock',
  'hub_enrollment', 'hub_review', 'hub_analytics',
  'section_roster_tab', 'self_enrollment', 'quick_actions', 'import_wizard', 'autogroup_studio', 'classroom_roster',
  'rubric_tab', 'rubric_builder', 'eval_controls', 'team_health_pulse', 'target_scale', 'eval_simulator',
  'analytics_tab', 'perception_deck', 'webpa_calibrator', 'anomaly_audit', 'results_summary', 'gradebook_matrix'
];

interface GuideCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: (stepIds?: string[]) => void;
  initialTab?: 'system' | 'tours' | 'features';
}

export const GuideCenterModal: React.FC<GuideCenterModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'tours' | 'features'>(initialTab || 'system');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);


  // Disable background scroll & handle keyboard shortcuts (Esc to close, / to search)
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const featureList: FeatureInfoItem[] = useMemo(() => {
    return Object.values(FEATURE_INFO_REGISTRY);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    featureList.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return ['All', ...Array.from(set)];
  }, [featureList]);

  const filteredFeatures = useMemo(() => {
    return featureList.filter(f => {
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch = (
        f.title.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.whatItDoes.toLowerCase().includes(q) ||
        f.whatToDo.some(t => t.toLowerCase().includes(q)) ||
        f.whatYouGet.some(g => g.toLowerCase().includes(q)) ||
        (f.formula && f.formula.toLowerCase().includes(q)) ||
        (f.proTip && f.proTip.toLowerCase().includes(q))
      );
      return matchCat && matchSearch;
    });
  }, [featureList, selectedCategory, searchQuery]);

  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return FOCUSED_TOUR_TRACKS;
    return FOCUSED_TOUR_TRACKS.filter(t => (
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keyTopics.some(k => k.toLowerCase().includes(q))
    ));
  }, [searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'fixed',
        inset: 0
      }}
    >
      <div
        className="modal-content guide-center-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '980px',
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-premium), 0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-color)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease'
        }}
      >
        {/* Modern Clean Header with Theme & Close Controls */}
        <div
          style={{
            padding: '1.15rem 1.65rem',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
                flexShrink: 0
              }}
            >
              <Compass size={22} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                PeerLens Academic Guidance &amp; System Manual
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                3-section pedagogical workflow, WebPA Loughborough formulas, per-team base marks, layout density, and interactive tours.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Operational Manual New Tab Launcher */}
            <a
              href="/guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                height: '32px',
                padding: '0 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                transition: 'all 0.15s ease'
              }}
              title="Open Complete Operational Manual in a new browser tab"
            >
              <BookOpen size={14} style={{ color: 'var(--primary)' }} />
              <span>Manual ↗</span>
            </a>

            {/* Sleek Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '34px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Close Guide Center (Esc)"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Minimalist Segmented Navigation & Search Bar */}
        <div
          style={{
            padding: '0.65rem 1.65rem',
            backgroundColor: 'var(--bg-app)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}
        >
          {/* Segmented Tab Switcher */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '9px',
              gap: '3px'
            }}
          >

            <button
              type="button"
              onClick={() => setActiveTab('system')}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'system' ? 700 : 600,
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'system' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'system' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'system' ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={13} style={{ color: activeTab === 'system' ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span>System &amp; Architecture</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tours')}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'tours' ? 700 : 600,
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'tours' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'tours' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'tours' ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Play size={13} style={{ color: activeTab === 'tours' ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span>Spotlight Tours</span>
              <span
                style={{
                  fontSize: '0.66rem',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: activeTab === 'tours' ? 'var(--primary-light)' : 'var(--bg-app)',
                  color: activeTab === 'tours' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700
                }}
              >
                {filteredTracks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('features')}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: activeTab === 'features' ? 700 : 600,
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'features' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'features' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'features' ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={13} style={{ color: activeTab === 'features' ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span>Feature &amp; Help Catalog</span>
              <span
                style={{
                  fontSize: '0.66rem',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: activeTab === 'features' ? 'var(--primary-light)' : 'var(--bg-app)',
                  color: activeTab === 'features' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: 700
                }}
              >
                {filteredFeatures.length}
              </span>
            </button>
          </div>

          {/* Minimal Search Input */}
          <div style={{ position: 'relative', width: '270px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search guides, math, features... (/)"
              style={{
                width: '100%',
                height: '32px',
                paddingLeft: '32px',
                paddingRight: '28px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '1.5rem 1.65rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.35rem',
            backgroundColor: 'var(--bg-app)',
            transition: 'background-color 0.2s ease'
          }}
        >
          {/* TAB 1: SYSTEM MANUAL & ARCHITECTURE */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
              
              {/* Introduction Banner */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-light) 100%)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ maxWidth: '640px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    Core Pedagogical Philosophy
                  </span>
                  <h3 style={{ margin: '0.35rem 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    3-Section End-to-End Evaluation Architecture
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.48 }}>
                    PeerLens streamlines the entire peer evaluation lifecycle into three intuitive, sequential stages: 
                    <strong style={{ color: 'var(--text-primary)' }}> Section 1 (Enrollment &amp; Teams)</strong>, <strong style={{ color: 'var(--text-primary)' }}>Section 2 (Review System)</strong>, and <strong style={{ color: 'var(--text-primary)' }}>Section 3 (Grading &amp; Performance Analytics)</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartTour(FULL_APP_STEP_IDS);
                  }}
                  className="btn btn-primary"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    gap: '0.45rem',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px var(--primary-glow)',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Play size={13} style={{ fill: 'currentColor' }} /> Start Master Tour
                </button>
              </div>

              {/* Full Operational Manual Dedicated Callout Card */}
              <div
                style={{
                  padding: '1rem 1.35rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
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
                      flexShrink: 0
                    }}
                  >
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Complete PeerLens Operational Manual &amp; Theory Guide
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      17 in-depth chapters detailing the Loughborough WebPA algorithm, Johari Window perception grids, BARS rubrics, and Canvas/Moodle LMS exports.
                    </p>
                  </div>
                </div>
                <a
                  href="/guide.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '0.5rem 1.1rem',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Open Manual (New Tab)</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* 3 Core Workflow Stages (Visual Interactive Cards) */}
              <div>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  The 3 Core Workflow Stages:
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* Stage 1 */}
                  <div
                    style={{
                      padding: '1.15rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={15} />
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>SECTION 1</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        Stage 1 of 3
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Student Enrollment &amp; Teams
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.42 }}>
                      Onboard student cohorts, configure demographic profiles, generate QR codes, and partition balanced peer teams.
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Key Features:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, lineHeight: 1.45 }}>
                        <li>Self-Enrollment QR code &amp; mobile join link</li>
                        <li>100 Demo Cohort Generator (35+ countries)</li>
                        <li>Smart Roster CSV/Excel Importer</li>
                        <li>AutoGroup Combinatorial Diversity Studio</li>
                        <li>Multi-Select Bulk Actions Toolbar</li>
                      </ul>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div
                    style={{
                      padding: '1.15rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'var(--accent-amber-light)', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Sliders size={15} />
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-amber)' }}>SECTION 2</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        Stage 2 of 3
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Review System &amp; Rubrics
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.42 }}>
                      Define criteria dimensions, qualitative anchors, 100% weight auto-balancing, team health pulse check-ins, and student evaluation governance.
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Key Features:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, lineHeight: 1.45 }}>
                        <li>100% Criteria Weight Auto-Balance bar</li>
                        <li>Standardized Rubric (IPAF Research-Synthesized)</li>
                        <li>Team Health Micro-Pulse Surveys (30s check-ins, 5 scale presets, blocker alerts)</li>
                        <li>Evaluation Form Controls (Self-evaluations, praise badges, profile locks)</li>
                        <li>Target Scale Normalization (20, 100%, Likert)</li>
                        <li>Interactive Student Smartphone Simulator</li>
                      </ul>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div
                    style={{
                      padding: '1.15rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'var(--accent-teal-light)', color: 'var(--accent-teal)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Award size={15} />
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-teal)' }}>SECTION 3</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        Stage 3 of 3
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Grading &amp; Performance Analytics
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.42 }}>
                      Loughborough WebPA multipliers, team-specific base marks, fudge weights, spider radars, and anomaly collusion audits.
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Key Features:</strong>
                      <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, lineHeight: 1.45 }}>
                        <li>Per-Team Base Marks + Global Calibrator</li>
                        <li>0%–100% Calibrator Fudge Weight slider</li>
                        <li>Multi-Axis Competency Spider Radar</li>
                        <li>Johari Window (±7.5% Blind Spot Matrix)</li>
                        <li>Master Gradebook &amp; Batch Student PDFs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interface Density Presets & Customization Guide */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <LayoutGrid size={16} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Interface Density &amp; Customization Presets
                  </h4>
                </div>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  PeerLens empowers instructors to tailor their workspace density to their exact teaching preference:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-teal)', backgroundColor: 'var(--accent-teal-light)', padding: '1px 6px', borderRadius: '4px' }}>
                        STANDARD MODE
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Default Instructor Workflow:</strong> Displays essential navigation, hub cards with progress metrics and launch buttons, and primary grading tools with zero clutter.
                    </p>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-amber)', backgroundColor: 'var(--accent-amber-light)', padding: '1px 6px', borderRadius: '4px' }}>
                        MINIMAL MODE
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Ultra-Focused View:</strong> Hides progress meters, quick launch pills, advanced audit cards, and secondary icons. Retains core roster, rubric builder, and gradebook for pure simplicity.
                    </p>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '1px 6px', borderRadius: '4px' }}>
                        CUSTOMIZE VIEW
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Granular Control:</strong> Click &ldquo;Customize View&rdquo; in the top navigation at any time to toggle any of the 40+ interface elements individually to match your classroom.
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Formative Feedback & Governance Systems */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <Heart size={16} style={{ color: 'var(--accent-rose)' }} />
                  <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Formative Feedback Systems &amp; Evaluation Governance
                  </h4>
                </div>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  PeerLens augments traditional summative peer evaluations with continuous formative micro-pulses, structured recognition badges, and rigorous form governance:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {/* Team Health Micro-Pulse */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <Activity size={14} style={{ color: 'var(--accent-teal)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Team Health Micro-Pulse Check-ins
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Rapid 30-second weekly micro-surveys measuring real-time team morale and collaboration without grading anxiety. Features 5 customizable rating scale presets (1-5 Likert, 0-10 NPS, 1-4 Performance, 1-3 Traffic Light, 1-10 Slider), natural alphanumeric team sorting (Team 1, 2, ..., 10), column sorting, and instant blocker detection alerts.
                    </p>
                  </div>

                  {/* Evaluation Form Controls & Permissions */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <ShieldCheck size={14} style={{ color: 'var(--accent-amber)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Evaluation Form Controls &amp; Permissions
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Fine-tune student submission forms with collapsible controls. Toggle self-evaluations, enable structured praise recognition tags across 6 pedagogical dimensions (Innovation, Technical Execution, Dependability, Collaboration, Leadership, Problem Solving), set qualitative reflection requirements, define team role baselines, and lock student profile editing.
                    </p>
                  </div>

                  {/* Quick Action Center */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <Zap size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Quick Action Pill &amp; Live Telemetry Dock
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Persistent floating dock providing 1-click workflow jumps (Alt+1/2/3), optional ambient live status ticker (completion %, pending counts, anomalies), master section expand/collapse, and granular interface module customization with pinning.
                    </p>
                  </div>

                  {/* Omni Search & Office Hours Dispute Studio */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <ShieldCheck size={14} style={{ color: 'var(--accent-teal)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Omni Search, Dispute Studio &amp; Medical Exemptions
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Universal search bar (<kbd style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>Ctrl+K</kbd> / <kbd style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>/</kbd>) with prefix filters (@students, #teams, &gt;actions, ?help). Includes 1-click Excused Absence WebPA factor neutralization and the Student Grade Dispute Studio with self-vs-peer delta criteria breakdown and automated response email drafting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mathematical Foundations & Algorithms Reference */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Calculator size={16} style={{ color: 'var(--accent-teal)' }} />
                  <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Academic Mathematical Foundations &amp; Algorithms
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {/* WebPA Formula */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                      1. Loughborough WebPA Peer Multiplier
                    </span>
                    <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary)', border: '1px solid var(--border-color)', marginBottom: '0.35rem', fontWeight: 700 }}>
                      WebPA = Received Peer Avg ÷ Team Peer Avg
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
                      Self-evaluations are strictly excluded. A multiplier of 1.00 equals expected contribution; &gt;1.00 indicates above-average contribution.
                    </p>
                  </div>

                  {/* Calibrated Mark Formula with Per-Team Base Marks */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                      2. Calibrated Final Grade (Per-Team Base Mark)
                    </span>
                    <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-teal)', border: '1px solid var(--border-color)', marginBottom: '0.35rem', fontWeight: 700 }}>
                      Grade = TeamBase × [(1 - W) + (W × WebPA)]
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
                      Award different base marks to different teams. W is instructor Fudge Weight (0.00 to 1.00). High contributors scale above their team mark.
                    </p>
                  </div>

                  {/* Johari Window Formula */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                      3. Johari Perception Alignment (±7.5% Threshold)
                    </span>
                    <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-amber)', border: '1px solid var(--border-color)', marginBottom: '0.35rem', fontWeight: 700 }}>
                      Delta = (Self Score - Peer Consensus) ÷ Max
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
                      |Delta| ≤ 7.5% → Accurately Calibrated; Delta &gt; +7.5% → Blind Spot (Overestimating); Delta &lt; -7.5% → Imposter (Underestimating).
                    </p>
                  </div>

                  {/* Anomaly Detection Formula */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                      4. Statistical Anomaly &amp; Collusion Audit
                    </span>
                    <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-rose)', border: '1px solid var(--border-color)', marginBottom: '0.35rem', fontWeight: 700 }}>
                      Flag = |Reviewer Score - Mean| &gt; 1.5 · σ
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
                      Flags ratings deviating &gt;1.5 standard deviations from peer consensus, detecting spiteful grading and reciprocal collusion rings.
                    </p>
                  </div>

                  {/* Excused Absence Formula */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
                      5. Excused Absence / Medical Exemption
                    </span>
                    <div style={{ padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary)', border: '1px solid var(--border-color)', marginBottom: '0.35rem', fontWeight: 700 }}>
                      WebPA = 1.000 → Grade = TeamBase
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.38 }}>
                      Neutralizes the student WebPA factor to 1.000, awards the team base mark without penalty, and isolates team denominators so teammates are not penalized.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SPOTLIGHT TOURS */}
          {activeTab === 'tours' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Master Full Walkthrough Hero Card */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--primary-light) 100%)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ maxWidth: '560px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--accent-teal)',
                        color: '#ffffff',
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        letterSpacing: '0.03em'
                      }}
                    >
                      COMPLETE MASTER WALKTHROUGH
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 700 }}>
                      16 Steps &bull; ~2 min &bull; End-to-End Pipeline
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Full End-to-End Classroom Walkthrough
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Walks through the streamlined Top Bar, Section 1 (Enrollment &amp; AutoGroup Studio), Section 2 (100% Balanced Rubrics &amp; Simulator), and Section 3 (WebPA Calibrator &amp; Spider Radars).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartTour(FULL_APP_STEP_IDS);
                  }}
                  className="btn btn-primary"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    gap: '0.45rem',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px var(--primary-glow)',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Play size={13} style={{ fill: 'currentColor' }} /> Start Master Tour
                </button>
              </div>

              {/* Focused Topic Subheading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Focused Topic Spotlight Tours:
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Highlights active controls on your screen
                </span>
              </div>

              {/* Grid of Focused Topic Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.85rem' }}>
                {filteredTracks.map(track => (
                  <div
                    key={track.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.1rem 1.25rem',
                      borderRadius: '11px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s ease',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-app)',
                              border: '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {track.icon}
                          </span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {track.title}
                            </h4>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {track.category}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-app)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {track.duration}
                          </span>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {track.stepCount} steps
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.42 }}>
                        {track.description}
                      </p>

                      {/* Key Topics Badges */}
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {track.keyTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.66rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-app)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              fontWeight: 500
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartTour(track.stepIds);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{
                          borderRadius: '7px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Play size={12} /> Start {track.duration} Tour <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredTracks.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No spotlight tours match &ldquo;{searchQuery}&rdquo;. <button type="button" className="btn btn-link btn-sm" onClick={() => setSearchQuery('')} style={{ fontSize: '0.78rem', textDecoration: 'underline' }}>Clear search</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FEATURE & HELP CATALOG */}
          {activeTab === 'features' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                  Category:
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      backgroundColor: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-surface)',
                      color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Feature List Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredFeatures.map(item => {
                  const isExpanded = expandedFeatureId === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-surface)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Accordion Row Header */}
                      <div
                        onClick={() => setExpandedFeatureId(isExpanded ? null : item.id)}
                        style={{
                          padding: '0.85rem 1.15rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? 'var(--bg-app)' : 'var(--bg-surface)',
                          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <FileText size={14} />
                          </span>
                          <div>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.title}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              &bull; {item.summary}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-app)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {item.category}
                          </span>
                          {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                        </div>
                      </div>

                      {/* Accordion Expanded Body */}
                      {isExpanded && (
                        <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: 'var(--bg-app)' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              Purpose &amp; What It Does:
                            </span>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                              {item.whatItDoes}
                            </p>
                          </div>

                          {/* 2-Column Info Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle size={13} /> What You Get From This:
                              </span>
                              <ul style={{ margin: '0.35rem 0 0 1.1rem', padding: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {item.whatYouGet.map((yg, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{yg}</li>
                                ))}
                              </ul>
                            </div>

                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <HelpCircle size={13} /> How to Control &amp; Use:
                              </span>
                              <ol style={{ margin: '0.35rem 0 0 1.1rem', padding: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {item.whatToDo.map((td, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.25rem' }}>{td}</li>
                                ))}
                              </ol>
                            </div>
                          </div>

                          {/* Formula / ProTip if present */}
                          {item.formula && (
                            <div style={{ padding: '0.5rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                              <strong style={{ color: 'var(--primary)' }}>Algorithm / Formula:</strong> {item.formula}
                            </div>
                          )}

                          {item.proTip && (
                            <div style={{ padding: '0.5rem 0.85rem', backgroundColor: 'var(--accent-teal-light)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.76rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sparkles size={13} style={{ color: 'var(--accent-teal)' }} /> <span><strong style={{ color: 'var(--accent-teal)' }}>Pro Tip:</strong> {item.proTip}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredFeatures.length === 0 && (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    No features match &ldquo;{searchQuery}&rdquo;. <button type="button" className="btn btn-link btn-sm" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} style={{ fontSize: '0.78rem', textDecoration: 'underline' }}>Clear search</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GuideCenterModal;
