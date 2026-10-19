// src/components/OnboardingChecklistWidget.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, ChevronDown, ChevronUp, Sparkles, X, Play,
  Users, Sliders, Award, Building2, Download,
  Calendar, Check, ArrowRight, Settings
} from 'lucide-react';
import { type ClassData } from '../utils/math';
import { getBranding } from '../utils/brandingPreferences';
import { type FeatureToggles } from '../utils/featurePreferences';

export interface OnboardingChecklistProps {
  activeClass: ClassData;
  studentCount: number;
  uniqueTeamCount: number;
  rubricWeightSum: number;
  hasEvaluations: boolean;
  onNavigateTab: (tab: 'hub' | 'roster' | 'grading' | 'results' | 'automation' | 'cloud') => void;
  onStartTour?: (stepIds?: string[]) => void;
  onLaunchSandbox: () => void;
  onOpenEnrollmentBuilder?: () => void;
  onOpenTeamKickoff?: (tab?: 'roles_config' | 'icebreakers' | 'charters') => void;
  onOpenBranding?: () => void;
  onOpenAutoGroup?: () => void;
  onAutoBalanceRubric?: () => void;
  onExportCSV?: () => void;
  onOpenSettings?: () => void;
  onOpenLayoutLibrary?: () => void;
  onToggleEditMode?: () => void;
  featureToggles?: FeatureToggles;
  onDismiss?: () => void;
  onToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export type ChecklistFilter = 'all' | 'stage1' | 'stage2' | 'stage3';

export const OnboardingChecklistWidget: React.FC<OnboardingChecklistProps> = ({
  activeClass,
  studentCount,
  uniqueTeamCount,
  rubricWeightSum,
  hasEvaluations,
  onNavigateTab,
  onStartTour,
  onLaunchSandbox,
  onOpenTeamKickoff,
  onOpenBranding,
  onOpenAutoGroup,
  onAutoBalanceRubric,
  onExportCSV,
  onOpenSettings,
  onOpenLayoutLibrary,
  onToggleEditMode,
  featureToggles,
  onDismiss,
  onToast
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('peer_onboarding_collapsed') === 'true';
  });

  const [activeFilter, setActiveFilter] = useState<ChecklistFilter>('all');
  const [hasConfiguredModules, setHasConfiguredModules] = useState(() => {
    return localStorage.getItem('peerlens_modules_configured') === 'true';
  });

  const markModulesConfigured = () => {
    setHasConfiguredModules(true);
    try {
      localStorage.setItem('peerlens_modules_configured', 'true');
    } catch (e) {}
  };

  useEffect(() => {
    if (featureToggles) {
      const isCustom = Object.values(featureToggles).some(v => v === false);
      if (isCustom) {
        markModulesConfigured();
      }
    }
    const handleFeaturesChanged = () => {
      markModulesConfigured();
    };
    window.addEventListener('peerlens_features_changed', handleFeaturesChanged);
    return () => window.removeEventListener('peerlens_features_changed', handleFeaturesChanged);
  }, [featureToggles]);

  const branding = useMemo(() => {
    return getBranding(activeClass?.id);
  }, [activeClass?.id]);

  // Master Collapse / Expand listener
  useEffect(() => {
    const handleCollapse = () => {
      setIsCollapsed(true);
      try {
        localStorage.setItem('peer_onboarding_collapsed', 'true');
      } catch (e) {}
    };
    const handleExpand = () => {
      setIsCollapsed(false);
      try {
        localStorage.setItem('peer_onboarding_collapsed', 'false');
      } catch (e) {}
    };
    window.addEventListener('peerlens_collapse_all', handleCollapse);
    window.addEventListener('peerlens_expand_all', handleExpand);
    return () => {
      window.removeEventListener('peerlens_collapse_all', handleCollapse);
      window.removeEventListener('peerlens_expand_all', handleExpand);
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('peer_onboarding_collapsed', String(next));
      return next;
    });
  };

  const steps = useMemo(() => {
    const isBranded = Boolean(branding.isCustomized || branding.institutionName || branding.institutionLogo);
    const hasChartersOrRoles = Boolean(
      (activeClass.teamCharterConfig && Object.keys(activeClass.teamCharterConfig).length > 0) ||
      activeClass.students.some(s => Boolean(s.role))
    );
    const isRubricBalanced = Math.abs(rubricWeightSum - 100) < 0.1;
    const hasScaleAndDeadline = Boolean(activeClass.targetScale && activeClass.deadline);

    return [
      // ─── STAGE 1: SETUP & COHORTS ──────────────────────────────────────────
      {
        id: 'roster',
        stage: 'stage1',
        stageName: '1. Setup & Roster',
        num: 1,
        title: 'Student Roster Enrollment',
        isCompleted: studentCount > 0,
        hint: studentCount > 0 
          ? `${studentCount} students enrolled in class` 
          : 'Share Join QR / link, import CSV spreadsheet, or load demo students',
        actionLabel: studentCount > 0 ? 'View Roster' : 'Enroll',
        icon: <Users size={13} style={{ color: studentCount > 0 ? 'var(--accent-teal)' : 'var(--primary)' }} />,
        onClick: () => onNavigateTab('roster')
      },
      {
        id: 'autogroup',
        stage: 'stage1',
        stageName: '1. Setup & Roster',
        num: 2,
        title: 'Diverse AutoGroup Formation',
        isCompleted: uniqueTeamCount > 0,
        hint: uniqueTeamCount > 0 
          ? `${uniqueTeamCount} balanced cohorts formed` 
          : 'Multi-attribute algorithmic mixing (skills, nationality, gender)',
        actionLabel: uniqueTeamCount > 0 ? 'Manage Teams' : 'AutoGroup',
        icon: <Sparkles size={13} style={{ color: uniqueTeamCount > 0 ? 'var(--accent-teal)' : 'var(--primary)' }} />,
        onClick: () => {
          onNavigateTab('roster');
          onOpenAutoGroup?.();
        }
      },
      {
        id: 'workspace_modules',
        stage: 'stage1',
        stageName: '1. Setup & Roster',
        num: 3,
        title: 'Workspace Modules & Layout',
        isCompleted: hasConfiguredModules,
        hint: hasConfiguredModules 
          ? 'Modules & card layout tailored in Settings / Presets' 
          : 'Configure enabled/disabled modules in Settings or press Alt+E to edit layout',
        actionLabel: 'Settings',
        icon: <Settings size={13} style={{ color: hasConfiguredModules ? 'var(--accent-teal)' : 'var(--primary)' }} />,
        onClick: () => {
          markModulesConfigured();
          if (onOpenSettings) onOpenSettings();
          else if (onOpenLayoutLibrary) onOpenLayoutLibrary();
          else if (onToggleEditMode) onToggleEditMode();
          else onNavigateTab('hub');
        }
      },
      {
        id: 'branding',
        stage: 'stage1',
        stageName: '1. Setup & Roster',
        num: 4,
        title: 'Institutional Branding & Portal',
        isCompleted: isBranded,
        hint: branding.institutionName 
          ? `Branded: "${branding.institutionName}"` 
          : 'Set university logo, course badge, term subtitle & custom theme',
        actionLabel: 'Branding',
        icon: <Building2 size={13} style={{ color: isBranded ? 'var(--accent-teal)' : 'var(--primary)' }} />,
        onClick: () => {
          if (onOpenBranding) onOpenBranding();
          else onNavigateTab('hub');
        }
      },

      // ─── STAGE 2: RUBRICS & POLICIES ──────────────────────────────────────
      {
        id: 'rubrics',
        stage: 'stage2',
        stageName: '2. Rubrics & Policies',
        num: 5,
        title: '100% Balanced Criteria Rubric',
        isCompleted: isRubricBalanced,
        hint: isRubricBalanced 
          ? 'All criteria weights balanced at 100%' 
          : `Current sum: ${rubricWeightSum}% (Must total 100% for WebPA mathematical fairness)`,
        actionLabel: isRubricBalanced ? 'Inspect' : 'Balance',
        icon: <Sliders size={13} style={{ color: isRubricBalanced ? 'var(--accent-teal)' : 'var(--accent-amber)' }} />,
        onClick: () => {
          onNavigateTab('grading');
          if (!isRubricBalanced && onAutoBalanceRubric) {
            onAutoBalanceRubric();
          }
        }
      },
      {
        id: 'scale_deadline',
        stage: 'stage2',
        stageName: '2. Rubrics & Policies',
        num: 6,
        title: 'Target Scale & Due Date',
        isCompleted: hasScaleAndDeadline,
        hint: hasScaleAndDeadline 
          ? `Scale: ${activeClass.targetScale} pts • Due: ${new Date(activeClass.deadline!).toLocaleDateString()}` 
          : 'Set institutional target scale (e.g. 100 or 20) & submission deadline',
        actionLabel: 'Scale',
        icon: <Calendar size={13} style={{ color: hasScaleAndDeadline ? 'var(--accent-teal)' : 'var(--accent-amber)' }} />,
        onClick: () => onNavigateTab('grading')
      },
      {
        id: 'charters',
        stage: 'stage2',
        stageName: '2. Rubrics & Policies',
        num: 7,
        title: 'Team Charters & Group Norms',
        isCompleted: hasChartersOrRoles,
        hint: hasChartersOrRoles 
          ? 'Roles assigned & mutual accountability agreements active' 
          : 'Assign student roles (Lead, Scribe) and establish mutual group agreements',
        actionLabel: 'Charters',
        icon: <Award size={13} style={{ color: hasChartersOrRoles ? 'var(--accent-teal)' : 'var(--primary)' }} />,
        onClick: () => {
          if (onOpenTeamKickoff) onOpenTeamKickoff('charters');
          else onNavigateTab('roster');
        }
      },

      // ─── STAGE 3: GRADING & LMS ───────────────────────────────────────────
      {
        id: 'webpa_export',
        stage: 'stage3',
        stageName: '3. Grading & LMS',
        num: 8,
        title: 'Peer Reviews & LMS Gradebook Export',
        isCompleted: hasEvaluations,
        hint: hasEvaluations 
          ? `${activeClass.reviews.length} reviews collected • Loughborough WebPA ready for Canvas / Moodle / Excel` 
          : 'Collect peer evaluation rounds or launch health pulse, then calibrate & export',
        actionLabel: hasEvaluations ? 'Export CSV' : 'View Results',
        icon: <Download size={13} style={{ color: hasEvaluations ? 'var(--accent-teal)' : 'var(--accent-teal)' }} />,
        onClick: () => {
          onNavigateTab('results');
          if (hasEvaluations && onExportCSV) onExportCSV();
        }
      }
    ];
  }, [
    branding,
    activeClass,
    studentCount,
    uniqueTeamCount,
    rubricWeightSum,
    hasEvaluations,
    hasConfiguredModules,
    onOpenBranding,
    onNavigateTab,
    onOpenSettings,
    onOpenLayoutLibrary,
    onToggleEditMode,
    onOpenAutoGroup,
    onOpenTeamKickoff,
    onAutoBalanceRubric,
    onExportCSV,
    onToast
  ]);

  const completedCount = steps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const filteredSteps = useMemo(() => {
    if (activeFilter === 'all') return steps;
    return steps.filter(s => s.stage === activeFilter);
  }, [steps, activeFilter]);

  const stage1Count = steps.filter(s => s.stage === 'stage1' && s.isCompleted).length;
  const stage2Count = steps.filter(s => s.stage === 'stage2' && s.isCompleted).length;
  const stage3Count = steps.filter(s => s.stage === 'stage3' && s.isCompleted).length;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        marginBottom: '1.15rem',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Sleek Master Header */}
      <div
        style={{
          padding: '0.65rem 1rem',
          backgroundColor: 'var(--bg-surface-hover)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)'
        }}
      >
        {/* Title, Badge & Progress Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: completedCount === steps.length ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
              color: completedCount === steps.length ? '#10b981' : 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 800,
              border: `1px solid ${completedCount === steps.length ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
            }}
          >
            {completedCount === steps.length ? <Check size={14} strokeWidth={2.5} /> : `${completedCount}/${steps.length}`}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Course Setup Checklist
              </span>
              <span 
                style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 750, 
                  color: completedCount === steps.length ? '#10b981' : 'var(--primary)', 
                  backgroundColor: completedCount === steps.length ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-app)', 
                  border: `1px solid ${completedCount === steps.length ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`, 
                  padding: '1px 7px', 
                  borderRadius: '999px' 
                }}
              >
                {progressPercent}% Complete ({completedCount} of {steps.length} Milestones)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Stage Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {!isCollapsed && (
            <div 
              style={{ 
                display: 'inline-flex', 
                backgroundColor: 'var(--bg-app)', 
                borderRadius: '7px', 
                padding: '2px', 
                border: '1px solid var(--border-color)',
                marginRight: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.66rem',
                  fontWeight: activeFilter === 'all' ? 750 : 600,
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                  color: activeFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: activeFilter === 'all' ? 'var(--shadow-xs)' : 'none'
                }}
              >
                All ({steps.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('stage1')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.66rem',
                  fontWeight: activeFilter === 'stage1' ? 750 : 600,
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeFilter === 'stage1' ? 'var(--bg-surface)' : 'transparent',
                  color: activeFilter === 'stage1' ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: activeFilter === 'stage1' ? 'var(--shadow-xs)' : 'none'
                }}
              >
                1. Setup ({stage1Count}/4)
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('stage2')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.66rem',
                  fontWeight: activeFilter === 'stage2' ? 750 : 600,
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeFilter === 'stage2' ? 'var(--bg-surface)' : 'transparent',
                  color: activeFilter === 'stage2' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  boxShadow: activeFilter === 'stage2' ? 'var(--shadow-xs)' : 'none'
                }}
              >
                2. Rubrics ({stage2Count}/3)
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('stage3')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.66rem',
                  fontWeight: activeFilter === 'stage3' ? 750 : 600,
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeFilter === 'stage3' ? 'var(--bg-surface)' : 'transparent',
                  color: activeFilter === 'stage3' ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  boxShadow: activeFilter === 'stage3' ? 'var(--shadow-xs)' : 'none'
                }}
              >
                3. Grading ({stage3Count}/1)
              </button>
            </div>
          )}

          {onStartTour && (
            <button
              type="button"
              onClick={() => onStartTour()}
              style={{
                padding: '0.26rem 0.58rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease'
              }}
              title="Launch Master Interactive Tour"
            >
              <Play size={11} style={{ fill: 'currentColor' }} /> Tour
            </button>
          )}

          <button
            type="button"
            onClick={onLaunchSandbox}
            style={{
              padding: '0.26rem 0.58rem',
              fontSize: '0.7rem',
              fontWeight: 750,
              backgroundColor: 'rgba(20, 184, 166, 0.12)',
              color: 'var(--accent-teal)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
            title="Launch Interactive Hands-on Guided Sandbox"
          >
            <Sparkles size={11} /> Sandbox
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.25rem 0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
            title={isCollapsed ? 'Expand Checklist' : 'Collapse Checklist'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                borderRadius: '4px'
              }}
              title="Hide Checklist (Can be restored anytime in Settings)"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Indicator */}
      <div style={{ width: '100%', height: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            backgroundColor: completedCount === steps.length ? '#10b981' : 'var(--primary)', 
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
          }} 
        />
      </div>

      {/* Expanded Interactive Cards Grid */}
      {!isCollapsed && (
        <div style={{ padding: '0.75rem 0.95rem', backgroundColor: 'var(--bg-surface)' }}>
          {completedCount === steps.length && (
            <div
              style={{
                padding: '0.55rem 0.85rem',
                marginBottom: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.74rem',
                color: '#059669',
                fontWeight: 650
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>All 8 Essential Course Milestones Complete!</strong> Your classroom is 100% prepared for student peer evaluation, Loughborough WebPA calculation, and Canvas / Moodle LMS gradebook export.
              </span>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.55rem'
            }}
          >
            {filteredSteps.map(step => (
              <div
                key={step.id}
                onClick={step.onClick}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: step.isCompleted ? 'rgba(20, 184, 166, 0.06)' : 'var(--bg-app)',
                  border: step.isCompleted ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.55rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = step.isCompleted ? 'var(--accent-teal)' : 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = step.isCompleted ? 'rgba(20, 184, 166, 0.3)' : 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
                  {step.isCompleted ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                  ) : (
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '1.5px solid var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        flexShrink: 0
                      }}
                    >
                      {step.num}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={step.hint}>
                      {step.hint}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 750,
                      color: step.isCompleted ? 'var(--accent-teal)' : 'var(--primary)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '5px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklistWidget;
