import React, { useState } from 'react';
import {
  Sparkles, CheckCircle, ArrowRight, RotateCcw,
  Check, ChevronUp, ChevronDown, Play, Compass, Pin, PinOff
} from 'lucide-react';

export interface SandboxMission {
  id: number;
  stageName: string;
  title: string;
  tab: 'roster' | 'grading' | 'results';
  instruction: string;
  targetHint: string;
  actionButtonLabel?: string;
  isCompleted: boolean;
}

interface GuidedSandboxHUDProps {
  currentMissionIndex: number;
  onSelectMission: (index: number) => void;
  onAutoCompleteStep: () => void;
  onExitAndReset: () => void;
  onKeepData: () => void;
  missions: SandboxMission[];
  onNavigateTab: (tab: 'roster' | 'grading' | 'results') => void;
}

export const GuidedSandboxHUD: React.FC<GuidedSandboxHUDProps> = ({
  currentMissionIndex,
  onSelectMission,
  onAutoCompleteStep,
  onExitAndReset,
  onKeepData,
  missions,
  onNavigateTab
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  const currentMission = missions[currentMissionIndex] || missions[0];
  const completedCount = missions.filter(m => m.isCompleted).length;
  const progressPercent = Math.round((completedCount / Math.max(1, missions.length)) * 100);

  return (
    <div
      style={{
        position: isPinned ? 'sticky' : 'relative',
        top: isPinned ? '3.65rem' : 'auto',
        zIndex: isPinned ? 930 : 10,
        marginBottom: '1rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid #10b981',
        boxShadow: isPinned 
          ? '0 10px 30px -5px rgba(16, 185, 129, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.05)' 
          : '0 4px 16px -2px rgba(16, 185, 129, 0.10)',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Header Bar — Clean Light Theme */}
      <div
        style={{
          padding: '0.6rem 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0
            }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                Interactive Hands-On Sandbox
              </h4>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.02em'
                }}
              >
                STEP {currentMissionIndex + 1} OF {missions.length} &bull; {progressPercent}% COMPLETE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
              Perform real actions on your screen. When finished, you can restore your workspace with 1 click.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={onExitAndReset}
            style={{
              padding: '0.28rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.15s ease'
            }}
            title="Reset workspace and exit sandbox"
          >
            <RotateCcw size={11} /> Reset &amp; Exit Sandbox
          </button>

          <button
            type="button"
            onClick={onKeepData}
            style={{
              padding: '0.28rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#047857',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.15s ease'
            }}
            title="Save sandbox cohort into your active course"
          >
            <Check size={11} /> Keep Data
          </button>

          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            style={{
              background: isPinned ? '#ecfdf5' : '#ffffff',
              border: isPinned ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
              borderRadius: '6px',
              color: isPinned ? '#047857' : '#64748b',
              cursor: 'pointer',
              padding: '0.25rem 0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.7rem',
              fontWeight: 600
            }}
            title={isPinned ? 'Unpin from top (Normal flow)' : 'Pin to top when scrolling (Floating Popout)'}
          >
            {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
            <span style={{ fontSize: '0.68rem' }}>{isPinned ? 'Pinned' : 'Floating'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0.25rem 0.4rem',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isMinimized ? 'Expand Sandbox Guide' : 'Minimize Sandbox Guide'}
          >
            {isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Step Pills Navigation Ribbon */}
      <div
        style={{
          padding: '0.4rem 1rem',
          backgroundColor: '#f8fafc',
          borderBottom: isMinimized ? 'none' : '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          overflowX: 'auto'
        }}
      >
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '0.25rem', whiteSpace: 'nowrap' }}>
          Missions ({completedCount}/{missions.length}):
        </span>

        {missions.map((mission, idx) => {
          const isActive = idx === currentMissionIndex;
          return (
            <button
              key={mission.id}
              type="button"
              onClick={() => {
                onSelectMission(idx);
                onNavigateTab(mission.tab);
              }}
              style={{
                flex: '0 0 auto',
                padding: '0.22rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: isActive ? 800 : 600,
                border: isActive ? '1.5px solid #10b981' : mission.isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#ecfdf5' : mission.isCompleted ? '#f0fdf4' : '#ffffff',
                color: isActive ? '#065f46' : mission.isCompleted ? '#166534' : '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease'
              }}
            >
              {mission.isCompleted ? (
                <CheckCircle size={12} style={{ color: '#16a34a' }} />
              ) : (
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#10b981' : '#e2e8f0',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {idx + 1}
                </span>
              )}
              <span>{mission.stageName}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Active Mission Instructions & Action Bar */}
      {!isMinimized && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                {currentMission.title}
              </h5>
              {currentMission.isCompleted && (
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#16a34a', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <Check size={11} /> Mission Completed
                </span>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.76rem', color: '#334155', lineHeight: 1.45 }}>
              {currentMission.instruction}
            </p>

            <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Compass size={12} />
              <span><b>Target:</b> {currentMission.targetHint}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {!currentMission.isCompleted && (
              <button
                type="button"
                onClick={onAutoCompleteStep}
                style={{
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease'
                }}
                title="Perform this step automatically as a demonstration"
              >
                <Play size={11} /> {currentMission.actionButtonLabel || 'Auto-Complete This Step'}
              </button>
            )}

            {currentMissionIndex < missions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  const nextIdx = currentMissionIndex + 1;
                  onSelectMission(nextIdx);
                  onNavigateTab(missions[nextIdx].tab);
                }}
                style={{
                  padding: '0.32rem 0.8rem',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                Next Mission <ArrowRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onExitAndReset}
                style={{
                  padding: '0.32rem 0.8rem',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle size={12} /> All Done &bull; Reset Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default GuidedSandboxHUD;
