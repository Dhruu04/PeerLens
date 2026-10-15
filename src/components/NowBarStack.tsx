import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Compass,
  Sparkles,
  Edit3,
  Users,
  Award,
  Search,
  ChevronUp,
  ChevronDown,
  Plus,
  Download,
  ArrowUp,
  Check,
  X,
  Minimize2,
  Maximize2,
  EyeOff
} from 'lucide-react';
import { QuickActionPill, type QuickActionPillProps } from './QuickActionPill';
import { GuidedSandboxHUD, type SandboxMission } from './GuidedSandboxHUD';
import { LayoutEditBar } from './LayoutEditBar';
import type { FeatureToggles } from '../utils/featurePreferences';

export type NowBarCardId = 'quickAction' | 'sandbox' | 'layoutEdit' | 'stickySummary';

export interface NowBarStackItem {
  id: NowBarCardId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
  subtext?: string;
}

export interface NowBarStackProps {
  // Quick Action Pill / Dock
  showQuickActionPill: boolean;
  quickActionProps: QuickActionPillProps;

  // Guided Sandbox HUD
  isSandboxActive: boolean;
  sandboxProps?: {
    currentMissionIndex: number;
    onSelectMission: (index: number) => void;
    onAutoCompleteStep: () => void;
    onExitAndReset: () => void;
    onKeepData: () => void;
    missions: SandboxMission[];
    onNavigateTab: (tab: 'roster' | 'grading' | 'results') => void;
  };

  // Layout Edit Mode Bar
  isEditMode: boolean;
  layoutEditProps?: {
    onClose: () => void;
    featureToggles: FeatureToggles;
    onApplyPreset: (preset: 'minimal' | 'standard' | 'full' | 'none') => void;
    activeTab: string;
    onNavigateTab: (tab: 'hub' | 'roster' | 'grading' | 'results') => void;
    shortcutsEnabled: boolean;
    onToggleShortcutsEnabled: (enabled: boolean) => void;
    onToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
    onToggleFeature?: (key: keyof FeatureToggles, value: boolean) => void;
  };

  // Sticky Section Action Summary Bar (Appears on scroll in Roster and Grading sections)
  isStickySummaryVisible: boolean;
  stickySummaryProps?: {
    activeTab: string;
    filteredStudentsCount: number;
    totalStudentsCount: number;
    teamsCount: number;
    submittedCount: number;
    completionRate: number;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onAddStudent: () => void;
    onExportExcel: () => void;
    onScrollToTop: () => void;
  };
}

export const NowBarStack: React.FC<NowBarStackProps> = ({
  showQuickActionPill,
  quickActionProps,
  isSandboxActive,
  sandboxProps,
  isEditMode,
  layoutEditProps,
  isStickySummaryVisible,
  stickySummaryProps
}) => {
  // 1. Build the list of active pills in the pile
  const activeItems = useMemo<NowBarStackItem[]>(() => {
    const list: NowBarStackItem[] = [];

    // Pill A: Quick Actions Tools
    if (showQuickActionPill) {
      const activeClass = quickActionProps.activeClass;
      const submitted = activeClass?.students.filter((s) => s.submitted).length || 0;
      const total = activeClass?.students.length || 0;
      const isCleanCanvas = Object.values(quickActionProps.featureToggles).every((v) => !v);
      list.push({
        id: 'quickAction',
        label: isCleanCanvas ? 'Clean Canvas' : 'Quick Action Center',
        shortLabel: isCleanCanvas ? 'Canvas' : 'Tools',
        icon: isCleanCanvas ? <EyeOff size={13} /> : <Compass size={13} />,
        accentColor: isCleanCanvas ? 'var(--accent-rose, #ef4444)' : 'var(--primary)',
        badge: isCleanCanvas
          ? 'Hide All'
          : (total > 0 ? `${submitted}/${total} (${Math.round((submitted / total) * 100)}%)` : undefined),
        subtext: isCleanCanvas ? 'All modules hidden' : (activeClass?.name || 'Class Tools')
      });
    }

    // Pill B: Guided Sandbox Walkthrough
    if (isSandboxActive && sandboxProps && sandboxProps.missions.length > 0) {
      const missionIdx = sandboxProps.currentMissionIndex;
      const currentMission = sandboxProps.missions[missionIdx];
      list.push({
        id: 'sandbox',
        label: `Mission ${missionIdx + 1}: ${currentMission?.title || 'Interactive Guide'}`,
        shortLabel: 'Sandbox',
        icon: <Sparkles size={13} />,
        accentColor: '#10b981',
        badge: `Step ${missionIdx + 1}/${sandboxProps.missions.length}`,
        subtext: currentMission?.targetHint || 'Guided Tour'
      });
    }

    // Pill C: Layout Edit Mode Bar
    if (isEditMode && layoutEditProps) {
      list.push({
        id: 'layoutEdit',
        label: 'Layout Edit Mode',
        shortLabel: 'Edit',
        icon: <Edit3 size={13} />,
        accentColor: '#f59e0b',
        badge: 'Customizing Views',
        subtext: 'Presets & Module Toggles'
      });
    }

    // Pill D: Sticky Section Action Summary (appears on scroll)
    if (
      isStickySummaryVisible &&
      stickySummaryProps &&
      (stickySummaryProps.activeTab === 'roster' || stickySummaryProps.activeTab === 'results')
    ) {
      const isRoster = stickySummaryProps.activeTab === 'roster';
      list.push({
        id: 'stickySummary',
        label: isRoster ? 'Roster Actions & Filter' : 'Gradebook Results & Export',
        shortLabel: isRoster ? 'Roster' : 'Results',
        icon: isRoster ? <Users size={13} /> : <Award size={13} />,
        accentColor: isRoster ? 'var(--primary)' : 'var(--accent-teal)',
        badge: isRoster
          ? `${stickySummaryProps.filteredStudentsCount} Students`
          : `${stickySummaryProps.completionRate}% Submitted`,
        subtext: isRoster ? `${stickySummaryProps.teamsCount} Teams` : 'Excel Export'
      });
    }

    return list;
  }, [
    showQuickActionPill,
    quickActionProps.activeClass,
    isSandboxActive,
    sandboxProps,
    isEditMode,
    layoutEditProps,
    isStickySummaryVisible,
    stickySummaryProps
  ]);

  // Selected pill in the stack
  const [selectedCardId, setSelectedCardId] = useState<NowBarCardId>('quickAction');

  // Animation direction state to trigger fluid slide up/down on scroll
  const [slideDirection, setSlideDirection] = useState<'down' | 'up' | 'none'>('none');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Micro capsule mode (user minimized the entire bar)
  const [isMicroCapsule, setIsMicroCapsule] = useState<boolean>(false);

  // Expanded detailed bottom sheet mode
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(false);

  // Track if layout edit mode pill is currently expanded into full card
  const [isLayoutEditExpanded, setIsLayoutEditExpanded] = useState<boolean>(false);

  // Track if quick action pill is currently expanded into full dock
  const [isQuickActionExpanded, setIsQuickActionExpanded] = useState<boolean>(false);

  // Hover state on the stack/pile
  const [isPileHovered, setIsPileHovered] = useState<boolean>(false);

  // Refs for scroll and swipe gestures
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTimeRef = useRef<number>(0);
  const wheelDeltaAccumulator = useRef<number>(0);
  const wheelResetTimeout = useRef<any>(null);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);

  // Micro-haptic helper for mobile feedback
  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  // Auto-focus new activities when they open
  const prevSandboxActive = useRef(isSandboxActive);
  const prevEditMode = useRef(isEditMode);
  const prevStickyVisible = useRef(isStickySummaryVisible);

  useEffect(() => {
    if (isSandboxActive && !prevSandboxActive.current) {
      setSelectedCardId('sandbox');
    }
    prevSandboxActive.current = isSandboxActive;
  }, [isSandboxActive]);

  useEffect(() => {
    if (isEditMode && !prevEditMode.current) {
      setSelectedCardId('layoutEdit');
    }
    prevEditMode.current = isEditMode;
  }, [isEditMode]);

  useEffect(() => {
    if (isStickySummaryVisible && !prevStickyVisible.current && !isSandboxActive && !isEditMode) {
      setSelectedCardId('stickySummary');
    }
    prevStickyVisible.current = isStickySummaryVisible;
  }, [isStickySummaryVisible, isSandboxActive, isEditMode]);

  // Fallback if current card is removed
  useEffect(() => {
    if (activeItems.length === 0) return;
    const exists = activeItems.some((item) => item.id === selectedCardId);
    if (!exists) {
      setSelectedCardId(activeItems[0].id);
    }
  }, [activeItems, selectedCardId]);

  // Cycle stack forward ('next') or backward ('prev')
  const handleCycle = useCallback(
    (direction: 'next' | 'prev') => {
      if (activeItems.length <= 1) return;

      const currentIndex = activeItems.findIndex((item) => item.id === selectedCardId);
      const nextIndex =
        direction === 'next'
          ? (currentIndex + 1) % activeItems.length
          : (currentIndex - 1 + activeItems.length) % activeItems.length;

      triggerHaptic(8);
      setSlideDirection(direction === 'next' ? 'down' : 'up');
      setIsTransitioning(true);
      setSelectedCardId(activeItems[nextIndex].id);

      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('none');
      }, 300);
    },
    [activeItems, selectedCardId]
  );

  // Direct switch to a specific pill
  const handleSelectPill = (id: NowBarCardId) => {
    if (id === selectedCardId) return;
    const currIdx = activeItems.findIndex((i) => i.id === selectedCardId);
    const targetIdx = activeItems.findIndex((i) => i.id === id);
    triggerHaptic(8);
    setSlideDirection(targetIdx > currIdx ? 'down' : 'up');
    setIsTransitioning(true);
    setSelectedCardId(id);
    setTimeout(() => {
      setIsTransitioning(false);
      setSlideDirection('none');
    }, 300);
  };

  // Close sheet on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSheetExpanded) {
        setIsSheetExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSheetExpanded]);

  // Mouse Wheel Scroll Listener attached directly to stack container:
  // When cursor is on the pile and the user scrolls with their mouse wheel, smoothly cycle pills!
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (activeItems.length <= 1) return;
      if (isSheetExpanded || isLayoutEditExpanded || isQuickActionExpanded) return; // Allow normal scrolling inside expanded cards

      // Prevent the underlying webpage from scrolling while the user is scrolling the pill pile
      e.preventDefault();
      e.stopPropagation();

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      wheelDeltaAccumulator.current += delta;

      clearTimeout(wheelResetTimeout.current);
      wheelResetTimeout.current = setTimeout(() => {
        wheelDeltaAccumulator.current = 0;
      }, 160);

      const now = Date.now();
      // Fluid cooldown between switches to prevent multiple fast triggers
      if (now - lastWheelTimeRef.current < 220) {
        wheelDeltaAccumulator.current = 0; // Clear accumulated delta so it doesn't queue up
        return;
      }

      if (Math.abs(wheelDeltaAccumulator.current) >= 8 || Math.abs(delta) >= 8) {
        lastWheelTimeRef.current = now;
        const dir = (wheelDeltaAccumulator.current > 0 || delta > 0) ? 'next' : 'prev';
        wheelDeltaAccumulator.current = 0;
        handleCycle(dir);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(wheelResetTimeout.current);
    };
  }, [activeItems.length, isSheetExpanded, isLayoutEditExpanded, isQuickActionExpanded, handleCycle]);

  // Touch Swipe Gesture Handlers for mobile & touchpads
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSheetExpanded) return;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSheetExpanded || activeItems.length <= 1) return;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;

    if (Math.abs(diffY) > 24) {
      if (diffY < 0) {
        handleCycle('next'); // Swiped up -> next card
      } else {
        handleCycle('prev'); // Swiped down -> prev card
      }
    } else if (Math.abs(diffX) > 30) {
      if (diffX < 0) {
        handleCycle('next'); // Swiped left -> next card
      } else {
        handleCycle('prev'); // Swiped right -> prev card
      }
    }
  };

  if (activeItems.length === 0) {
    return null;
  }

  const activeIndex = Math.max(0, activeItems.findIndex((i) => i.id === selectedCardId));
  const currentItem = activeItems[activeIndex] || activeItems[0];
  const totalCount = activeItems.length;
  const isStacked = totalCount > 1;

  return (
    <aside
      ref={containerRef}
      className={`now-bar-stack-root ${isPileHovered ? 'pile-hovered' : ''} ${isSheetExpanded ? 'sheet-open' : ''} ${isMicroCapsule ? 'micro-active' : ''}`}
      onMouseEnter={() => setIsPileHovered(true)}
      onMouseLeave={() => setIsPileHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Interactive Now Bar Activity Pile"
    >
      {/* ======================================================== */}
      {/* A. FULL EXPANDED BOTTOM SHEET FOR EXTENDED TOOLS          */}
      {/* ======================================================== */}
      {isSheetExpanded && (
        <div className="now-bar-expanded-sheet">
          <div className="now-bar-sheet-drag-handle" onClick={() => setIsSheetExpanded(false)} />
          <div className="now-bar-sheet-header">
            <div className="now-bar-sheet-title-group">
              <span style={{ color: currentItem.accentColor }}>{currentItem.icon}</span>
              <h4>{currentItem.label}</h4>
              {currentItem.badge && (
                <span className="now-bar-chip-badge">{currentItem.badge}</span>
              )}
            </div>
            <button
              type="button"
              className="now-bar-sheet-close-btn"
              onClick={() => setIsSheetExpanded(false)}
              title="Collapse"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="now-bar-sheet-body">
            {selectedCardId === 'sandbox' && sandboxProps && (
              <GuidedSandboxHUD
                currentMissionIndex={sandboxProps.currentMissionIndex}
                onSelectMission={sandboxProps.onSelectMission}
                onAutoCompleteStep={sandboxProps.onAutoCompleteStep}
                onExitAndReset={sandboxProps.onExitAndReset}
                onKeepData={sandboxProps.onKeepData}
                missions={sandboxProps.missions}
                onNavigateTab={sandboxProps.onNavigateTab}
                embedded={true}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* B. ULTRA-MINIMAL FLOATING MICRO-PILL (When minimized)     */}
      {/* ======================================================== */}
      {isMicroCapsule ? (
        <div
          className="now-bar-micro-capsule"
          onClick={() => setIsMicroCapsule(false)}
          title="Click to expand Now Bar stack"
        >
          <span className="now-bar-micro-dot" style={{ backgroundColor: currentItem.accentColor }} />
          <span className="now-bar-micro-icon" style={{ color: currentItem.accentColor }}>{currentItem.icon}</span>
          <span className="now-bar-micro-title">{currentItem.label}</span>
          {isStacked && (
            <span className="now-bar-micro-count">+{totalCount - 1} in stack</span>
          )}
          <Maximize2 size={11} className="now-bar-micro-expand-icon" />
        </div>
      ) : (
        /* ======================================================== */
        /* C. TRUE PHYSICAL 3D PILE / STACK OF PILLS                */
        /* Snug, optimized vertical offsets with fluid physics      */
        /* ======================================================== */
        <div className="now-bar-pill-pile-stage">
          {activeItems.map((item, index) => {
            // Calculate relative depth in circular pile
            const relOffset = (index - activeIndex + totalCount) % totalCount;
            const isTop = relOffset === 0;
            const isSecond = relOffset === 1;
            const isThird = relOffset === 2;
            const isHidden = relOffset >= 3;

            const isEditExpandedCard = isTop && item.id === 'layoutEdit' && isLayoutEditExpanded;
            const isAnyExpanded = isLayoutEditExpanded || isQuickActionExpanded || isSheetExpanded;

            // Tight, snug physical stacking offsets (pure 2D integer transforms, crisp native rendering):
            let transformStyle = '';
            let zIndexVal = 20 - relOffset;
            let opacityVal = 1;

            if (isTop) {
              transformStyle = 'none';
              zIndexVal = 30;
              opacityVal = 1;
            } else if (isSecond) {
              const offsetY = isPileHovered ? 8 : 5;
              transformStyle = `translateY(${offsetY}px) scale(0.98)`;
              zIndexVal = 20;
              opacityVal = isAnyExpanded ? 0 : (isPileHovered ? 0.98 : 0.88);
            } else if (isThird) {
              const offsetY = isPileHovered ? 16 : 9;
              transformStyle = `translateY(${offsetY}px) scale(0.96)`;
              zIndexVal = 10;
              opacityVal = isAnyExpanded ? 0 : (isPileHovered ? 0.88 : 0.68);
            } else if (isHidden) {
              transformStyle = 'translateY(22px) scale(0.93)';
              zIndexVal = 5;
              opacityVal = 0;
            }

            return (
              <div
                key={item.id}
                className={`now-bar-pile-layer ${isTop ? 'layer-top' : 'layer-peeking'} ${isSecond ? 'layer-second' : ''} ${isThird ? 'layer-third' : ''} ${isHidden ? 'layer-hidden' : ''} ${isEditExpandedCard ? 'layer-expanded-edit' : ''}`}
                style={{
                  transform: transformStyle,
                  zIndex: zIndexVal,
                  opacity: opacityVal,
                  borderBottomColor: !isTop ? item.accentColor : undefined,
                  boxShadow: !isTop
                    ? `0 10px 24px -4px rgba(0, 0, 0, 0.32), 0 1px 6px ${item.accentColor}35`
                    : undefined
                }}
                onClick={!isTop ? () => handleSelectPill(item.id) : undefined}
                title={!isTop ? `Scroll wheel or click to bring "${item.label}" to front` : undefined}
              >
                {/* 1. TOP ACTIVE PILL: Full rich interactive controls with fluid slide entrance */}
                {isTop && (
                  <div className={`now-bar-pill-body ${isTransitioning ? (slideDirection === 'down' ? 'anim-slide-down' : 'anim-slide-up') : ''}`}>
                    {/* CARD CONTENT A: QUICK ACTIONS */}
                    {item.id === 'quickAction' && (
                      <div className="now-bar-card-content now-bar-quick-actions">
                        <QuickActionPill
                          {...quickActionProps}
                          embedded={true}
                          isExpanded={isQuickActionExpanded}
                          onExpandChange={setIsQuickActionExpanded}
                        />
                      </div>
                    )}

                    {/* CARD CONTENT B: GUIDED SANDBOX */}
                    {item.id === 'sandbox' && sandboxProps && (
                      <div className="now-bar-card-content now-bar-sandbox-pill">
                        <div className="now-bar-sandbox-left">
                          <span className="now-bar-mission-pill">
                            <Sparkles size={11} className="text-emerald" />
                            <span>Mission {sandboxProps.currentMissionIndex + 1}/{sandboxProps.missions.length}</span>
                          </span>

                          <span className="now-bar-mission-title">
                            {sandboxProps.missions[sandboxProps.currentMissionIndex]?.title || 'Sandbox Guide'}
                          </span>

                          <span className="now-bar-mission-target">
                            {sandboxProps.missions[sandboxProps.currentMissionIndex]?.tab.toUpperCase()}
                          </span>
                        </div>

                        <div className="now-bar-sandbox-actions">
                          <button
                            type="button"
                            className="btn btn-emerald btn-sm now-bar-action-btn"
                            onClick={sandboxProps.onAutoCompleteStep}
                            title="Auto-complete current mission step"
                          >
                            <Check size={11} /> Auto-Complete Step
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm now-bar-action-btn"
                            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                            title="Expand Mission Briefing"
                          >
                            <ChevronUp size={12} />
                            <span>Guide</span>
                          </button>

                          <button
                            type="button"
                            className="now-bar-close-btn"
                            onClick={sandboxProps.onExitAndReset}
                            title="Exit Sandbox"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CARD CONTENT C: LAYOUT EDIT MODE */}
                    {item.id === 'layoutEdit' && layoutEditProps && (
                      <div className="now-bar-card-content now-bar-layout-pill">
                        <LayoutEditBar
                          isOpen={true}
                          onClose={layoutEditProps.onClose}
                          featureToggles={layoutEditProps.featureToggles}
                          onApplyPreset={layoutEditProps.onApplyPreset}
                          activeTab={layoutEditProps.activeTab}
                          onNavigateTab={layoutEditProps.onNavigateTab}
                          shortcutsEnabled={layoutEditProps.shortcutsEnabled}
                          onToggleShortcutsEnabled={layoutEditProps.onToggleShortcutsEnabled}
                          onToast={layoutEditProps.onToast}
                          onToggleFeature={layoutEditProps.onToggleFeature}
                          embedded={true}
                          isExpanded={isLayoutEditExpanded}
                          onExpandChange={setIsLayoutEditExpanded}
                        />
                      </div>
                    )}

                    {/* CARD CONTENT D: STICKY SUMMARY BAR */}
                    {item.id === 'stickySummary' && stickySummaryProps && (
                      <div className="now-bar-card-content now-bar-summary-pill">
                        <div className="now-bar-summary-stat">
                          {stickySummaryProps.activeTab === 'roster' ? (
                            <>
                              <Users size={14} className="text-primary" />
                              <span className="now-bar-stat-text">
                                <strong>{stickySummaryProps.filteredStudentsCount}</strong> of <strong>{stickySummaryProps.totalStudentsCount}</strong> Students ({stickySummaryProps.teamsCount} Teams)
                              </span>
                            </>
                          ) : (
                            <>
                              <Award size={14} className="text-teal" />
                              <span className="now-bar-stat-text">
                                <strong>{stickySummaryProps.submittedCount}/{stickySummaryProps.totalStudentsCount}</strong> Reviews ({stickySummaryProps.completionRate}%)
                              </span>
                            </>
                          )}
                        </div>

                        <span className="now-bar-divider" />

                        {stickySummaryProps.activeTab === 'roster' && (
                          <div className="now-bar-summary-controls">
                            <div className="now-bar-search-box">
                              <Search size={11} className="now-bar-search-icon" />
                              <input
                                type="text"
                                placeholder="Quick filter..."
                                className="form-input now-bar-search-input"
                                value={stickySummaryProps.searchTerm}
                                onChange={(e) => stickySummaryProps.onSearchChange(e.target.value)}
                              />
                              {stickySummaryProps.searchTerm && (
                                <button
                                  type="button"
                                  className="now-bar-search-clear"
                                  onClick={() => stickySummaryProps.onSearchChange('')}
                                  title="Clear filter"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm now-bar-action-btn"
                              onClick={stickySummaryProps.onAddStudent}
                            >
                              <Plus size={11} /> Add Student
                            </button>
                          </div>
                        )}

                        {stickySummaryProps.activeTab === 'results' && (
                          <div className="now-bar-summary-controls">
                            <button
                              type="button"
                              className="btn btn-teal btn-sm now-bar-action-btn"
                              onClick={stickySummaryProps.onExportExcel}
                            >
                              <Download size={11} /> Excel Report
                            </button>
                          </div>
                        )}

                        <span className="now-bar-divider" />

                        <button
                          type="button"
                          className="now-bar-circle-btn"
                          onClick={stickySummaryProps.onScrollToTop}
                          title="Scroll to top of page"
                        >
                          <ArrowUp size={12} />
                        </button>
                      </div>
                    )}

                    {/* STACK PAGINATION INDICATOR (Pill-shaped indicator track) */}
                    {isStacked && !isLayoutEditExpanded && (
                      <div className="now-bar-pile-pagination" title="Scroll wheel on pill to switch">
                        <div className="now-bar-pagination-track">
                          {activeItems.map((dotItem, dotIdx) => {
                            const isDotActive = dotIdx === activeIndex;
                            return (
                              <button
                                key={dotItem.id}
                                type="button"
                                className={`now-bar-pile-dot ${isDotActive ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPill(dotItem.id);
                                }}
                                style={{
                                  backgroundColor: isDotActive ? dotItem.accentColor : undefined,
                                  boxShadow: isDotActive ? `0 0 6px ${dotItem.accentColor}80` : undefined
                                }}
                                title={`Switch to ${dotItem.label}`}
                                aria-label={`Switch to ${dotItem.label}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Minimize trigger */}
                    {!isLayoutEditExpanded && (
                      <button
                        type="button"
                        className="now-bar-minimize-btn"
                        onClick={() => setIsMicroCapsule(true)}
                        title="Minimize Now Bar stack to tiny floating pill"
                      >
                        <Minimize2 size={11} />
                      </button>
                    )}
                  </div>
                )}

                {/* 2. PEEKING PILLS IN THE PILE: Clean stacked peek strip */}
                {!isTop && (
                  <div className="now-bar-peek-strip">
                    <div className="now-bar-peek-left">
                      <span className="now-bar-peek-icon" style={{ color: item.accentColor }}>
                        {item.icon}
                      </span>
                      <span className="now-bar-peek-label">
                        {item.shortLabel || item.label}
                      </span>
                    </div>

                    <div className="now-bar-peek-right">
                      {item.badge && (
                        <span className="now-bar-peek-badge">
                          {item.badge}
                        </span>
                      )}
                      <span className="now-bar-peek-hint">
                        Scroll / tap
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};

export default NowBarStack;
