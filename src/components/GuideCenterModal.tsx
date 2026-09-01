import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass, Search, Play, BookOpen, Sparkles, X, 
  Users, Sliders, Award, QrCode, Maximize2, 
  CheckCircle, HelpCircle, ChevronDown, ChevronUp,
  FileText, ArrowRight
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
    id: 'enrollment_track',
    title: 'Student Enrollment & QR Onboarding',
    category: 'Roster & Setup',
    stepCount: 4,
    duration: '45 sec',
    description: 'Generate classroom QR codes, share direct mobile registration links, bulk-import spreadsheets, and load realistic demo student cohorts.',
    icon: <QrCode size={18} className="text-teal" />,
    stepIds: ['self_enrollment', 'quick_actions', 'import_wizard', 'classroom_roster'],
    keyTopics: ['QR Presentation', '100 Diverse Students', 'Excel/CSV Import', 'Duplicate Audit']
  },
  {
    id: 'diversity_track',
    title: 'Diversity Balancing & AutoGroup Studio',
    category: 'Team Formation',
    stepCount: 3,
    duration: '40 sec',
    description: 'Master combinatorial team partitioning with automated 50/50 gender parity, cross-cultural nationality dispersion, and CEFR English balancing.',
    icon: <Users size={18} className="text-indigo" />,
    stepIds: ['autogroup_studio', 'classroom_roster', 'projector_mode'],
    keyTopics: ['Combinatorial Balancing', 'Gender Parity', 'CEFR English Mix', 'Team Roster View']
  },
  {
    id: 'rubrics_track',
    title: 'Weighted Rubrics & Evaluation Simulator',
    category: 'Criteria & Scales',
    stepCount: 3,
    duration: '45 sec',
    description: 'Configure multi-dimensional criteria with 100% weightage balancing, accredited templates (AAC&U, ABET), and test the student rating simulator.',
    icon: <Sliders size={18} className="text-primary" />,
    stepIds: ['rubric_tab', 'rubric_builder', 'eval_simulator'],
    keyTopics: ['100% Equal Weighting', 'AAC&U VALUE Preset', 'Score Simulator', 'Qualitative Tiers']
  },
  {
    id: 'projector_email_track',
    title: 'Classroom Projector & Email Dispatcher',
    category: 'Live Operations',
    stepCount: 3,
    duration: '40 sec',
    description: 'Discover the full-screen privacy-safe auditorium display, email notification engine (Brevo/EmailJS), and submission closing countdowns.',
    icon: <Maximize2 size={18} className="text-teal" />,
    stepIds: ['projector_mode', 'email_dispatcher', 'settings_hub'],
    keyTopics: ['Auditorium Projector', 'Brevo SMTP Delivery', 'Cloud Sync', 'Hotkey Shortcuts']
  },
  {
    id: 'analytics_track',
    title: 'Perception Analytics & WebPA Gradebook',
    category: 'Grading & Reports',
    stepCount: 3,
    duration: '45 sec',
    description: 'Explore Competency Spider Radars, Johari Window self-vs-peer blind spot detection, WebPA multipliers, and batch PDF report generation.',
    icon: <Award size={18} className="text-primary" />,
    stepIds: ['analytics_tab', 'perception_deck', 'gradebook_matrix'],
    keyTopics: ['Spider Radar Overlay', 'Johari Blind Spots', 'WebPA Calibrator', 'Student PDF Reports']
  }
];

export const FULL_APP_STEP_IDS = [
  'class_header', 'workspace_switcher', 'command_palette', 'projector_mode',
  'email_dispatcher', 'settings_hub', 'self_enrollment', 'quick_actions',
  'import_wizard', 'autogroup_studio', 'classroom_roster', 'rubric_tab',
  'rubric_builder', 'eval_simulator', 'analytics_tab', 'perception_deck',
  'gradebook_matrix'
];

interface GuideCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: (stepIds?: string[]) => void;
}

export const GuideCenterModal: React.FC<GuideCenterModalProps> = ({
  isOpen,
  onClose,
  onStartTour
}) => {
  const [activeTab, setActiveTab] = useState<'tours' | 'features'>('tours');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)' }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '94%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Modern Minimal Light Header */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#4f46e5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.18)'
              }}
            >
              <Compass size={18} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Academic Guidance &amp; Tutorial Center
                </h2>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  Interactive
                </span>
              </div>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Explore live interactive spotlight tours, learn feature workflows, and master peer evaluation.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            title="Close Guide Center"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Minimalist Segmented Navigation & Search Bar */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}
        >
          {/* Minimalist Segmented Tab Switcher */}
          <div
            style={{
              display: 'inline-flex',
              padding: '3px',
              backgroundColor: '#e2e8f0',
              borderRadius: '8px',
              gap: '3px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('tours')}
              style={{
                padding: '0.3rem 0.8rem',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'tours' ? 700 : 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'tours' ? '#ffffff' : 'transparent',
                color: activeTab === 'tours' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'tours' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Play size={12} style={{ color: activeTab === 'tours' ? '#4f46e5' : '#64748b' }} />
              <span>Interactive Tours</span>
              <span
                style={{
                  fontSize: '0.66rem',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: activeTab === 'tours' ? '#eef2ff' : '#f1f5f9',
                  color: activeTab === 'tours' ? '#4f46e5' : '#64748b',
                  fontWeight: 700
                }}
              >
                {FOCUSED_TOUR_TRACKS.length + 1}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('features')}
              style={{
                padding: '0.3rem 0.8rem',
                fontSize: '0.76rem',
                fontWeight: activeTab === 'features' ? 700 : 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'features' ? '#ffffff' : 'transparent',
                color: activeTab === 'features' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'features' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={12} style={{ color: activeTab === 'features' ? '#4f46e5' : '#64748b' }} />
              <span>Feature Knowledge Base</span>
              <span
                style={{
                  fontSize: '0.66rem',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: activeTab === 'features' ? '#eef2ff' : '#f1f5f9',
                  color: activeTab === 'features' ? '#4f46e5' : '#64748b',
                  fontWeight: 700
                }}
              >
                {featureList.length}
              </span>
            </button>
          </div>

          {/* Minimal Search Input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search guides & features..."
              style={{
                width: '100%',
                height: '30px',
                paddingLeft: '30px',
                paddingRight: '28px',
                fontSize: '0.76rem',
                borderRadius: '7px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.15rem', backgroundColor: '#ffffff' }}>
          
          {/* TAB 1: INTERACTIVE SCREEN TOURS */}
          {activeTab === 'tours' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Master Full Walkthrough Hero Card (Single Primary Launchpad) */}
              <div
                style={{
                  padding: '1.15rem 1.35rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                  border: '1.5px solid #c7d2fe',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.85rem'
                }}
              >
                <div style={{ maxWidth: '500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <span
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.03em'
                      }}
                    >
                      COMPLETE MASTER TOUR
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }}>
                      16 Steps &bull; ~2 min &bull; 4 Academic Stages
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    End-to-End Classroom Walkthrough
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#475569', lineHeight: 1.42 }}>
                    Covers workspace setup, student enrollment, diversity auto-grouping, 100% weighted rubrics, grading simulator, and WebPA perception matrix.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartTour(FULL_APP_STEP_IDS);
                  }}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    gap: '0.4rem',
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Play size={13} style={{ fill: '#ffffff' }} /> Start Master Tour
                </button>
              </div>

              {/* Section Subheading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Focused Topic Spotlight Tours:
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Points directly to active controls on your screen
                </span>
              </div>

              {/* Grid of 5 Unique Focused Topic Cards (Zero Duplication) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.75rem' }}>
                {filteredTracks.map(track => (
                  <div
                    key={track.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1rem 1.15rem',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      gap: '0.65rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {track.icon}
                          </span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                              {track.title}
                            </h4>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                              {track.category}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569'
                            }}
                          >
                            {track.duration}
                          </span>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: '#eef2ff',
                              color: '#4f46e5'
                            }}
                          >
                            {track.stepCount} steps
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '0 0 0.45rem 0', fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                        {track.description}
                      </p>

                      {/* Key Topics Badges */}
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {track.keyTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#334155',
                              fontWeight: 500
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f8fafc' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartTour(track.stepIds);
                        }}
                        style={{
                          backgroundColor: '#f8fafc',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Play size={11} /> Start {track.duration} Tour <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PROCESS & FEATURE KNOWLEDGE BASE */}
          {activeTab === 'features' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginRight: '0.25rem' }}>
                  Category:
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      backgroundColor: selectedCategory === cat ? '#4f46e5' : '#f1f5f9',
                      color: selectedCategory === cat ? '#ffffff' : '#475569',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Feature List Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {filteredFeatures.map(item => {
                  const isExpanded = expandedFeatureId === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: '9px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Accordion Row Header */}
                      <div
                        onClick={() => setExpandedFeatureId(isExpanded ? null : item.id)}
                        style={{
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '5px',
                              backgroundColor: '#eef2ff',
                              color: '#4f46e5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FileText size={13} />
                          </span>
                          <div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                              {item.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.45rem' }}>
                              &bull; {item.summary}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569'
                            }}
                          >
                            {item.category}
                          </span>
                          {isExpanded ? <ChevronUp size={15} color="#64748b" /> : <ChevronDown size={15} color="#64748b" />}
                        </div>
                      </div>

                      {/* Accordion Expanded Body */}
                      {isExpanded && (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#fafafa' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              Purpose &amp; What It Does:
                            </span>
                            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.42 }}>
                              {item.whatItDoes}
                            </p>
                          </div>

                          {/* 2-Column Info Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                            <div style={{ padding: '0.65rem', backgroundColor: '#ffffff', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle size={12} /> What You Get From This:
                              </span>
                              <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0, fontSize: '0.74rem', color: '#334155', lineHeight: 1.38 }}>
                                {item.whatYouGet.map((yg, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{yg}</li>
                                ))}
                              </ul>
                            </div>

                            <div style={{ padding: '0.65rem', backgroundColor: '#ffffff', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <HelpCircle size={12} /> How to Control &amp; Use:
                              </span>
                              <ol style={{ margin: '0.3rem 0 0 1rem', padding: 0, fontSize: '0.74rem', color: '#334155', lineHeight: 1.38 }}>
                                {item.whatToDo.map((td, idx) => (
                                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{td}</li>
                                ))}
                              </ol>
                            </div>
                          </div>

                          {/* Formula / ProTip if present */}
                          {item.formula && (
                            <div style={{ padding: '0.45rem 0.75rem', backgroundColor: '#ffffff', borderRadius: '5px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.72rem', color: '#0f172a' }}>
                              <b>Algorithm:</b> {item.formula}
                            </div>
                          )}

                          {item.proTip && (
                            <div style={{ padding: '0.45rem 0.75rem', backgroundColor: '#f0fdf4', borderRadius: '5px', border: '1px solid #bbf7d0', fontSize: '0.74rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Sparkles size={12} /> <span><b>Pro Tip:</b> {item.proTip}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
