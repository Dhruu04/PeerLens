import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3, Check, X, BookmarkPlus, LayoutGrid, Users, Sliders, 
  Award, Keyboard, Sparkles, Lightbulb, GripVertical, 
  ChevronUp, ChevronDown, RotateCcw
} from 'lucide-react';
import type { FeatureToggles } from '../utils/featurePreferences';
import { MODULE_ITEMS } from '../utils/moduleRegistry';
import { saveCustomProfile } from '../utils/customViewProfiles';

interface LayoutEditBarProps {
  isOpen: boolean;
  onClose: () => void;
  featureToggles: FeatureToggles;
  onToggleFeature?: (key: keyof FeatureToggles, value: boolean) => void;
  onApplyPreset: (preset: 'minimal' | 'standard' | 'full') => void;
  activeTab: string;
  onNavigateTab: (tab: 'hub' | 'roster' | 'grading' | 'results') => void;
  shortcutsEnabled: boolean;
  onToggleShortcutsEnabled: (enabled: boolean) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LayoutEditBar: React.FC<LayoutEditBarProps> = ({
  isOpen,
  onClose,
  featureToggles,
  onApplyPreset,
  activeTab,
  onNavigateTab,
  shortcutsEnabled,
  onToggleShortcutsEnabled,
  onToast
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');

  // Dragging state: position in client pixels
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0
  });

  // Clamp position to viewport on resize
  useEffect(() => {
    const handleResize = () => {
      if (!position || !barRef.current) return;
      const barWidth = barRef.current.offsetWidth;
      const barHeight = barRef.current.offsetHeight;
      const maxX = Math.max(10, window.innerWidth - barWidth - 10);
      const maxY = Math.max(10, window.innerHeight - barHeight - 10);
      setPosition(prev => {
        if (!prev) return null;
        return {
          x: Math.max(10, Math.min(prev.x, maxX)),
          y: Math.max(10, Math.min(prev.y, maxY))
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  if (!isOpen) return null;

  const totalModules = MODULE_ITEMS.length;
  const visibleCount = MODULE_ITEMS.filter(m => !!featureToggles[m.key]).length;
  const visiblePercentage = Math.round((visibleCount / totalModules) * 100);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only primary button
    const bar = barRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top
    };
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;
      const barWidth = bar.offsetWidth;
      const barHeight = bar.offsetHeight;

      const newX = Math.max(10, Math.min(window.innerWidth - barWidth - 10, dragStartRef.current.initX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - barHeight - 10, dragStartRef.current.initY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleResetPosition = () => {
    setPosition(null);
    onToast('Edit bar repositioned to bottom center', 'info');
  };

  const handleSaveProfile = () => {
    const trimmed = profileNameInput.trim();
    if (!trimmed) {
      onToast('Please enter a profile name.', 'warning');
      return;
    }
    const saved = saveCustomProfile(trimmed, featureToggles, shortcutsEnabled);
    if (saved) {
      onToast(`Saved view profile "${trimmed}"!`, 'success');
      setProfileNameInput('');
      setIsSavingProfile(false);
    }
  };

  const isPositionCustom = position !== null;

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        ...(isPositionCustom
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: 'auto',
              transform: 'none'
            }
          : {
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)'
            }),
        zIndex: 99999,
        width: 'auto',
        maxWidth: isExpanded ? '920px' : '680px',
        minWidth: '280px',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1.5px solid var(--border-color)',
        borderRadius: isExpanded ? '16px' : '9999px',
        padding: isExpanded ? '0.65rem 1rem' : '0.35rem 0.5rem 0.35rem 0.45rem',
        boxShadow: isDragging
          ? '0 25px 50px rgba(0, 0, 0, 0.35), 0 0 20px var(--primary-glow)'
          : 'var(--shadow-premium, 0 16px 36px rgba(0, 0, 0, 0.18)), 0 0 16px var(--primary-glow, rgba(79, 70, 229, 0.15))',
        display: 'flex',
        flexDirection: isExpanded ? 'column' : 'row',
        alignItems: isExpanded ? 'stretch' : 'center',
        gap: isExpanded ? '0.55rem' : '0.45rem',
        color: 'var(--text-primary)',
        transition: isDragging ? 'none' : 'border-radius 180ms ease, padding 180ms ease, box-shadow 180ms ease',
        userSelect: isDragging ? 'none' : 'auto'
      }}
    >
      {/* MINIMAL PILL MODE (Compact 1-Line Bar) */}
      {!isExpanded ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', width: '100%' }}>
          {/* Movable Drag Grip Handle */}
          <div
            onPointerDown={handlePointerDown}
            onDoubleClick={handleResetPosition}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem 0.25rem',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              touchAction: 'none',
              transition: 'color 120ms ease'
            }}
            title="Drag to move this pill anywhere on screen (Double-click to center)"
          >
            <GripVertical size={15} />
          </div>

          {/* Mode Badge & Module Counter */}
          <div
            onPointerDown={handlePointerDown}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              boxShadow: '0 2px 6px var(--primary-glow, rgba(79, 70, 229, 0.3))',
              flexShrink: 0
            }}
            title="Drag to move pill"
          >
            <Edit3 size={11} />
            <span>Edit Mode</span>
          </div>

          <span
            onPointerDown={handlePointerDown}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap'
            }}
            title={`${visibleCount} of ${totalModules} modules visible`}
          >
            {visibleCount}/{totalModules} ({visiblePercentage}%)
          </span>

          <span style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 0.1rem', flexShrink: 0 }} />

          {/* Quick Density Presets Segmented Buttons */}
          <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => onApplyPreset('minimal')}
              style={{
                border: 'none',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Minimal density layout"
            >
              Min
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('standard')}
              style={{
                border: 'none',
                borderLeft: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Standard density layout"
            >
              Std
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('full')}
              style={{
                border: 'none',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: 'var(--accent-teal)',
                cursor: 'pointer'
              }}
              title="Full Power density layout"
            >
              Full
            </button>
          </div>

          {/* Reset position icon if custom placed */}
          {isPositionCustom && (
            <button
              type="button"
              onClick={handleResetPosition}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              title="Reset pill position to bottom center"
            >
              <RotateCcw size={12} />
            </button>
          )}

          {/* Done Editing Button */}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-teal btn-sm"
            style={{
              height: '26px',
              padding: '0 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              gap: '0.25rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              flexShrink: 0
            }}
            title="Finish layout editing (Esc)"
          >
            <Check size={12} />
            <span>Done</span>
          </button>

          {/* Expand Details Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 120ms ease, transform 120ms ease'
            }}
            title="Expand layout controls & navigation tabs"
          >
            <ChevronUp size={13} />
          </button>
        </div>
      ) : (
        /* EXPANDED CONTROL CENTER MODE */
        <>
          {/* Top Row: Drag handle, Header, Section Tabs, Done, Minimize */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Movable Drag Grip Handle */}
              <div
                onPointerDown={handlePointerDown}
                onDoubleClick={handleResetPosition}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem 0.25rem',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  touchAction: 'none'
                }}
                title="Drag to move this window anywhere on screen (Double-click to center)"
              >
                <GripVertical size={16} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}
              >
                <Edit3 size={11} />
                <span>Layout Edit Mode</span>
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <strong>{visibleCount}</strong> of <strong>{totalModules}</strong> modules visible ({visiblePercentage}%)
              </span>
            </div>

            {/* Section Jump Tabs */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                gap: '2px'
              }}
            >
              <button
                type="button"
                onClick={() => onNavigateTab('hub')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'hub' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'hub' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={11} /> Hub
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('roster')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'roster' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'roster' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Users size={11} /> 1. Enrollment
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('grading')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'grading' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'grading' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Sliders size={11} /> 2. Review
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('results')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'results' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'results' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Award size={11} /> 3. Analytics
              </button>
            </div>

            {/* Right Buttons: Done & Collapse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-teal btn-sm"
                style={{
                  height: '28px',
                  padding: '0 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  gap: '0.25rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Check size={12} />
                <span>Done Editing</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Collapse to minimal pill"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Row 2: Presets, Shortcuts, Save View */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Presets:</span>
              <button
                type="button"
                onClick={() => onApplyPreset('minimal')}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Minimal
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset('standard')}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset('full')}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid var(--accent-teal)',
                  background: 'var(--accent-teal-light)',
                  color: 'var(--accent-teal)',
                  cursor: 'pointer'
                }}
              >
                Full Power
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Shortcuts Status Quick Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !shortcutsEnabled;
                  onToggleShortcutsEnabled(next);
                  onToast(next ? 'Keyboard shortcuts enabled' : 'Keyboard shortcuts disabled', 'info');
                }}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: shortcutsEnabled ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                  background: shortcutsEnabled ? 'var(--accent-teal-light)' : 'var(--bg-app)',
                  color: shortcutsEnabled ? 'var(--accent-teal)' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
                title={shortcutsEnabled ? 'Keybindings are enabled' : 'Keybindings are disabled'}
              >
                <Keyboard size={11} />
                <span>Shortcuts: {shortcutsEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Save Profile Button */}
              <button
                type="button"
                onClick={() => setIsSavingProfile(prev => !prev)}
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid var(--primary)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
                title="Save current layout as a custom view profile"
              >
                <BookmarkPlus size={11} />
                <span>Save View</span>
              </button>

              {isPositionCustom && (
                <button
                  type="button"
                  onClick={handleResetPosition}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    cursor: 'pointer'
                  }}
                  title="Reset bar position to bottom center"
                >
                  <RotateCcw size={10} />
                  <span>Reset Position</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Save View Profile Form */}
          {isSavingProfile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--bg-app)',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border: '1.5px solid var(--primary)',
                boxShadow: '0 4px 14px var(--primary-glow, rgba(79, 70, 229, 0.15))'
              }}
            >
              <Sparkles size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <input
                type="text"
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
                placeholder="Custom Profile Name (e.g. Exam Mode, Grading Week)"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveProfile();
                  if (e.key === 'Escape') setIsSavingProfile(false);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                style={{
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: '5px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsSavingProfile(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Bottom Hint Banner */}
          <div
            style={{
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.35rem',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lightbulb size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
              <span>Click visible modules to hide. Click dashed slots to restore. Drag grip to move pill.</span>
            </div>
            <div>
              Press <kbd style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.62rem' }}>Esc</kbd> when finished.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
