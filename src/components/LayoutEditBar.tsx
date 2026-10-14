import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Edit3, Check, X, BookmarkPlus, LayoutGrid, Users, Sliders, 
  Award, Keyboard, Sparkles, Lightbulb, GripVertical, 
  ChevronUp, ChevronDown, RotateCcw, Search, Plus, Layers, SlidersHorizontal,
  Eye, EyeOff, Compass, ShieldCheck
} from 'lucide-react';
import type { FeatureToggles } from '../utils/featurePreferences';
import { MODULE_ITEMS, type ModuleCategory, getTabForModuleCategory } from '../utils/moduleRegistry';
import { 
  saveCustomProfile, 
  getCustomProfiles, 
  subscribeCustomProfiles, 
  type CustomViewProfile 
} from '../utils/customViewProfiles';

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
  embedded?: boolean;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
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
  onToast,
  onToggleFeature,
  embedded = false,
  isExpanded: propIsExpanded,
  onExpandChange
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = propIsExpanded !== undefined ? propIsExpanded : internalExpanded;
  const toggleExpanded = (val: boolean) => {
    if (propIsExpanded === undefined) {
      setInternalExpanded(val);
    }
    if (onExpandChange) onExpandChange(val);
  };

  // Save View Profile state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [customProfiles, setCustomProfiles] = useState<CustomViewProfile[]>(() => getCustomProfiles());

  useEffect(() => {
    return subscribeCustomProfiles((list) => {
      setCustomProfiles(list);
    });
  }, []);

  // Interactive Module Catalog Drawer
  const [showModuleCatalog, setShowModuleCatalog] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryTab, setCatalogCategoryTab] = useState<'all' | ModuleCategory>('all');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Dragging state for non-embedded standalone mode
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

  // Module counts
  const totalModules = MODULE_ITEMS.length;
  const visibleCount = MODULE_ITEMS.filter(m => !!featureToggles[m.key]).length;
  const hiddenCount = totalModules - visibleCount;
  const visiblePercentage = Math.round((visibleCount / totalModules) * 100);

  // Section module counts for tab indicators
  const sectionCounts = useMemo(() => {
    const getCounts = (cat: ModuleCategory) => {
      const items = MODULE_ITEMS.filter((m) => m.category === cat);
      const vis = items.filter((m) => !!featureToggles[m.key]).length;
      return { visible: vis, total: items.length };
    };
    return {
      header: getCounts('header'),
      hub: getCounts('hub'),
      roster: getCounts('roster'),
      autogroup: getCounts('autogroup'),
      rubric: getCounts('rubric'),
      analytics: getCounts('analytics'),
      footer: getCounts('footer')
    };
  }, [featureToggles]);

  // Filtered module catalog items for the drawer
  const catalogFilteredItems = useMemo(() => {
    const q = catalogSearchQuery.trim().toLowerCase();
    return MODULE_ITEMS.filter((item) => {
      // 1. Category tab filter
      if (catalogCategoryTab !== 'all' && item.category !== catalogCategoryTab) return false;

      // 2. Status filter
      const isVisible = !!featureToggles[item.key];
      if (catalogStatusFilter === 'visible' && !isVisible) return false;
      if (catalogStatusFilter === 'hidden' && isVisible) return false;

      // 3. Search query
      if (!q) return true;
      const parentModule = item.parentKey ? MODULE_ITEMS.find(m => m.key === item.parentKey) : null;
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (parentModule && parentModule.title.toLowerCase().includes(q)) ||
        (item.parentKey && item.parentKey.toLowerCase().includes(q))
      );
    });
  }, [catalogSearchQuery, catalogCategoryTab, catalogStatusFilter, featureToggles]);

  // Pointer drag handlers for detached mode
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || embedded) return;
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

  const scrollToAndHighlightModule = (key: keyof FeatureToggles) => {
    const item = MODULE_ITEMS.find((m) => m.key === key);
    if (!item) return;

    // 1. Tab switching: check if module belongs to a different section tab
    const targetTab = getTabForModuleCategory(item.category);
    const didSwitchTab = !!(targetTab && targetTab !== activeTab && onNavigateTab);
    if (didSwitchTab && targetTab) {
      onNavigateTab(targetTab);
    }

    // 2. Ensure collapsed accordion sections or details are expanded so element exists in rendered DOM
    try {
      window.dispatchEvent(new CustomEvent('peerlens_expand_all'));
    } catch (e) {}

    // 3. Fluid gliding and spotlight animation
    const delay = didSwitchTab ? 130 : 40;
    setTimeout(() => {
      // Find the element by data attribute or id
      let targetEl = document.querySelector(
        `[data-module-key="${key}"], #module-slot-${key}`
      ) as HTMLElement | null;

      // Fallback: if submodule isn't found directly, try finding the parent container
      if (!targetEl && item.parentKey) {
        targetEl = document.querySelector(
          `[data-module-key="${item.parentKey}"], #module-slot-${item.parentKey}`
        ) as HTMLElement | null;
      }

      if (targetEl) {
        // Resolve display: contents to first visible child for bounding rect and spotlight
        let renderEl = targetEl;
        if (renderEl.style.display === 'contents' && renderEl.firstElementChild) {
          renderEl = renderEl.firstElementChild as HTMLElement;
        }

        // QoL Fix: Prevent module from being obscured behind the expanded bottom layout studio!
        const studioRect = barRef.current?.getBoundingClientRect();
        const studioTop = (studioRect && studioRect.top > 100 && studioRect.top < window.innerHeight)
          ? studioRect.top
          : (isExpanded ? window.innerHeight * 0.48 : window.innerHeight);

        const headerOffset = 70; // top navigation breathing room
        const visibleHeight = Math.max(160, studioTop - headerOffset);
        const elRect = renderEl.getBoundingClientRect();
        const currentScrollY = window.scrollY || window.pageYOffset;

        let targetScrollY: number;
        if (elRect.height >= visibleHeight) {
          // If element is taller than the visible gap above studio, pin its top with a clean offset below header
          targetScrollY = currentScrollY + elRect.top - headerOffset - 16;
        } else {
          // Center the element cleanly within the visible window ABOVE the studio!
          const centerInVisibleArea = headerOffset + (visibleHeight / 2);
          targetScrollY = currentScrollY + elRect.top - centerInVisibleArea + (elRect.height / 2);
        }

        window.scrollTo({
          top: Math.max(0, targetScrollY),
          behavior: 'smooth'
        });

        // Clear any previous spotlight animations
        document.querySelectorAll('.module-spotlight-highlight').forEach((node) => {
          node.classList.remove('module-spotlight-highlight');
        });

        // Trigger reflow to restart animation reliably
        void renderEl.offsetWidth;
        renderEl.classList.add('module-spotlight-highlight');

        // Clean up animation class after 2.4s
        setTimeout(() => {
          renderEl?.classList.remove('module-spotlight-highlight');
        }, 2400);
      }
    }, delay);
  };

  const handleToggleModule = (key: keyof FeatureToggles) => {
    if (!onToggleFeature) return;
    const nextVal = !featureToggles[key];
    onToggleFeature(key, nextVal);

    // QoL: If restoring a submodule whose parent container is hidden, automatically restore parent too!
    const item = MODULE_ITEMS.find((m) => m.key === key);
    if (nextVal && item?.parentKey && !featureToggles[item.parentKey]) {
      onToggleFeature(item.parentKey, true);
    }

    const title = item?.title || key;
    onToast(nextVal ? `Restored "${title}"` : `Hidden "${title}"`, nextVal ? 'success' : 'info');

    // Smoothly glide to the module space and highlight it with impressive spotlight!
    scrollToAndHighlightModule(key);
  };

  const isPositionCustom = position !== null;

  return (
    <div
      ref={barRef}
      style={{
        position: embedded ? 'relative' : 'fixed',
        ...(embedded
          ? { left: 'auto', top: 'auto', bottom: 'auto', transform: 'none' }
          : (isPositionCustom
              ? {
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  bottom: 'auto',
                  transform: 'none'
                }
              : {
                  bottom: '1.25rem',
                  left: '50%',
                  transform: 'translateX(-50%)'
                })),
        zIndex: embedded ? 10 : 99999,
        width: embedded ? '100%' : 'auto',
        maxWidth: embedded ? '100%' : (isExpanded ? '920px' : '680px'),
        minWidth: embedded ? 'auto' : '280px',
        backgroundColor: embedded ? 'transparent' : 'var(--bg-surface)',
        border: embedded ? 'none' : '1px solid var(--border-color)',
        borderRadius: embedded ? (isExpanded ? '18px' : '9999px') : (isExpanded ? '18px' : '9999px'),
        padding: embedded
          ? (isExpanded ? '0' : '0.22rem 0.45rem')
          : (isExpanded ? '0.95rem 1.35rem 0.8rem' : '0.35rem 0.5rem 0.35rem 0.45rem'),
        boxShadow: embedded ? 'none' : (isDragging
          ? '0 25px 50px rgba(0, 0, 0, 0.35), 0 0 20px var(--primary-glow)'
          : 'var(--shadow-premium, 0 16px 36px rgba(0, 0, 0, 0.18)), 0 0 16px var(--primary-glow, rgba(79, 70, 229, 0.15))'),
        display: 'flex',
        flexDirection: isExpanded ? 'column' : 'row',
        alignItems: isExpanded ? 'stretch' : 'center',
        gap: isExpanded ? '0.5rem' : '0.45rem',
        color: 'var(--text-primary)',
        transition: isDragging ? 'none' : 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: isDragging ? 'none' : 'auto'
      }}
    >
      {/* =========================================================================
          A. MINIMAL PILL MODE (Compact 1-Line Bar)
          ========================================================================= */}
      {!isExpanded ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', width: '100%' }}>
          {/* Movable Drag Grip Handle (Only in standalone detached mode) */}
          {!embedded && (
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
                touchAction: 'none'
              }}
              title="Drag to move this pill anywhere on screen (Double-click to center)"
            >
              <GripVertical size={15} />
            </div>
          )}

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
              onClick={() => {
                onApplyPreset('minimal');
                onToast('Essentials layout applied: Keeps interface clean and simple.', 'info');
              }}
              style={{
                border: 'none',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: visiblePercentage <= 30 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Essentials Only: Hides advanced analytics to keep the interface clean and simple."
            >
              Essentials
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyPreset('standard');
                onToast('Recommended layout restored: Balanced classroom layout.', 'info');
              }}
              style={{
                border: 'none',
                borderLeft: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: visiblePercentage > 30 && visiblePercentage <= 75 ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Recommended: The balanced classroom layout with essential tools."
            >
              Recommended
            </button>
            <button
              type="button"
              onClick={() => {
                onApplyPreset('full');
                onToast('Show All layout enabled: Turns on every available feature and tool.', 'success');
              }}
              style={{
                border: 'none',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: visiblePercentage > 75 ? 'var(--accent-teal)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Show All Modules: Turns on every available feature and tool."
            >
              Show All
            </button>
          </div>

          {/* Reset position icon if custom placed */}
          {isPositionCustom && (
            <button
              type="button"
              onClick={handleResetPosition}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Reset bar position"
            >
              <RotateCcw size={11} />
            </button>
          )}

          {/* Done Editing button */}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-teal btn-sm"
            style={{
              height: '26px',
              padding: '0 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 800,
              gap: '0.2rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Check size={11} />
            <span>Done</span>
          </button>

          {/* Expand to Studio Chevron */}
          <button
            type="button"
            onClick={() => toggleExpanded(true)}
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
              flexShrink: 0
            }}
            title="Expand layout controls"
          >
            <ChevronUp size={13} />
          </button>
        </div>
      ) : (
        /* =========================================================================
            B. EXPANDED CONTROL CENTER (Clean, Organized, 2 Tight Non-Wrapping Rows)
            ========================================================================= */
        <>
          {/* ROW 1: Identity & Stats (Left) | Section Tabs (Center) | Done & Collapse (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', width: '100%', flexWrap: 'nowrap' }}>
            {/* Left: Studio Identity & Counter Meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  padding: '0.24rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  flexShrink: 0
                }}
              >
                <SlidersHorizontal size={12} />
                <span>Layout Studio</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.71rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{visibleCount}</strong>
                <span>of</span>
                <strong style={{ color: 'var(--text-primary)' }}>{totalModules}</strong>
                <span style={{ color: 'var(--text-muted)' }}>({visiblePercentage}%)</span>
                <div style={{ width: '40px', height: '6px', borderRadius: '9999px', backgroundColor: 'var(--border-color)', overflow: 'hidden', marginLeft: '2px' }}>
                  <div
                    style={{
                      width: `${visiblePercentage}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--primary)',
                      transition: 'width 200ms ease'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Center: Section Jump Tabs (Hub, Enrollment, Review, Analytics) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                gap: '2px',
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={() => onNavigateTab('hub')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.22rem 0.55rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'hub' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'hub' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                title={`Classroom Home Hub (${sectionCounts.hub.visible}/${sectionCounts.hub.total} visible)`}
              >
                <LayoutGrid size={11} />
                <span>Hub</span>
                <span
                  style={{
                    fontSize: '0.61rem',
                    fontWeight: 700,
                    opacity: activeTab === 'hub' ? 0.95 : 0.65,
                    backgroundColor: activeTab === 'hub' ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                >
                  {sectionCounts.hub.visible}/{sectionCounts.hub.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('roster')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.22rem 0.55rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'roster' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'roster' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                title={`Section 1: Enrollment & Teams (${sectionCounts.roster.visible}/${sectionCounts.roster.total} visible)`}
              >
                <Users size={11} />
                <span>Enrollment</span>
                <span
                  style={{
                    fontSize: '0.61rem',
                    fontWeight: 700,
                    opacity: activeTab === 'roster' ? 0.95 : 0.65,
                    backgroundColor: activeTab === 'roster' ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                >
                  {sectionCounts.roster.visible}/{sectionCounts.roster.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('grading')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.22rem 0.55rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'grading' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'grading' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                title={`Section 2: Rubric & Review Configuration (${sectionCounts.rubric.visible}/${sectionCounts.rubric.total} visible)`}
              >
                <Sliders size={11} />
                <span>Review</span>
                <span
                  style={{
                    fontSize: '0.61rem',
                    fontWeight: 700,
                    opacity: activeTab === 'grading' ? 0.95 : 0.65,
                    backgroundColor: activeTab === 'grading' ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                >
                  {sectionCounts.rubric.visible}/{sectionCounts.rubric.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('results')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.22rem 0.55rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'results' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'results' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                title={`Section 3: Grading & Performance Analytics (${sectionCounts.analytics.visible}/${sectionCounts.analytics.total} visible)`}
              >
                <Award size={11} />
                <span>Analytics</span>
                <span
                  style={{
                    fontSize: '0.61rem',
                    fontWeight: 700,
                    opacity: activeTab === 'results' ? 0.95 : 0.65,
                    backgroundColor: activeTab === 'results' ? 'rgba(255,255,255,0.22)' : 'var(--bg-surface)',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                >
                  {sectionCounts.analytics.visible}/{sectionCounts.analytics.total}
                </span>
              </button>
            </div>

            {/* Right: Done Editing & Collapse Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-teal btn-sm"
                style={{
                  height: '28px',
                  padding: '0 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  gap: '0.3rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                }}
                title="Finish editing layout (Esc)"
              >
                <Check size={13} />
                <span>Done Editing</span>
              </button>

              <button
                type="button"
                onClick={() => toggleExpanded(false)}
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
                  justifyContent: 'center',
                  transition: 'all 120ms ease'
                }}
                title="Collapse to compact floating pill"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* ROW 2: Density Presets (Left) | Module Catalog (Center) | Utilities (Right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem',
              width: '100%',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.45rem',
              flexWrap: 'nowrap'
            }}
          >
            {/* Left: Density Presets Segmented Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Presets:
              </span>
              <div style={{ display: 'inline-flex', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)' }}>
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset('minimal');
                    onToast('Essentials layout applied: Keeps interface clean and simple.', 'info');
                  }}
                  style={{
                    border: 'none',
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: visiblePercentage <= 30 ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: visiblePercentage <= 30 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  title="Essentials Only: Hides advanced analytics to keep the interface clean and simple."
                >
                  Essentials
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset('standard');
                    onToast('Recommended layout restored: Balanced classroom layout.', 'info');
                  }}
                  style={{
                    border: 'none',
                    borderLeft: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: visiblePercentage > 30 && visiblePercentage <= 75 ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: visiblePercentage > 30 && visiblePercentage <= 75 ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  title="Recommended: The balanced classroom layout with essential tools."
                >
                  Recommended
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset('full');
                    onToast('Show All layout enabled: Turns on every available feature and tool.', 'success');
                  }}
                  style={{
                    border: 'none',
                    padding: '0.22rem 0.55rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: visiblePercentage > 75 ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                    color: visiblePercentage > 75 ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                  title="Show All Modules: Turns on every available feature and tool."
                >
                  Show All
                </button>
              </div>
            </div>

            {/* Center: Module Catalog Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowModuleCatalog(prev => !prev)}
                style={{
                  height: '26px',
                  padding: '0 0.65rem',
                  borderRadius: '7px',
                  border: showModuleCatalog ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: showModuleCatalog ? 'var(--primary-light)' : 'var(--bg-app)',
                  color: showModuleCatalog ? 'var(--primary)' : 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 120ms ease'
                }}
                title="Search and toggle all 93 modules individually"
              >
                <Search size={11} />
                <span>Module Catalog ({totalModules})</span>
                <ChevronDown
                  size={11}
                  style={{
                    transform: showModuleCatalog ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms ease'
                  }}
                />
              </button>
            </div>

            {/* Right: Keybindings, Save View Profile & Saved Views */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              {/* Saved Profiles Dropdown: ONLY rendered when user has 1 or more saved profiles */}
              {customProfiles.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const profId = e.target.value;
                    const p = customProfiles.find(cp => cp.id === profId);
                    if (p) {
                      if (onToggleFeature) {
                        Object.entries(p.toggles).forEach(([k, v]) => {
                          onToggleFeature(k as keyof FeatureToggles, v);
                        });
                      }
                      if (p.shortcutsEnabled !== undefined) {
                        onToggleShortcutsEnabled(p.shortcutsEnabled);
                      }
                      onToast(`Applied profile "${p.name}"`, 'success');
                    }
                    e.target.value = '';
                  }}
                  style={{
                    height: '26px',
                    padding: '0 0.45rem',
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  title="Apply a saved custom view profile"
                >
                  <option value="" disabled>Saved Views ({customProfiles.length})</option>
                  {customProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {/* Save View Button */}
              <button
                type="button"
                onClick={() => setIsSavingProfile(prev => !prev)}
                style={{
                  height: '26px',
                  padding: '0 0.55rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'var(--primary-light)',
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

              {/* Shortcuts Status Quick Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !shortcutsEnabled;
                  onToggleShortcutsEnabled(next);
                  onToast(next ? 'Keyboard shortcuts enabled' : 'Keyboard shortcuts disabled', 'info');
                }}
                style={{
                  height: '26px',
                  padding: '0 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  borderRadius: '7px',
                  border: shortcutsEnabled ? '1px solid var(--accent-teal)' : '1px solid var(--border-color)',
                  backgroundColor: shortcutsEnabled ? 'var(--accent-teal-light)' : 'var(--bg-app)',
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
            </div>
          </div>

          {/* ROW 3: Full-Width Contextual Helper Tip Banner (Never truncated) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              width: '100%',
              userSelect: 'none',
              marginTop: '0.1rem'
            }}
          >
            <Lightbulb size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <span>
              Click any visible module on the screen to hide • Click dashed slots to restore • Press <kbd style={{ padding: '1px 5px', fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Esc</kbd> when finished
            </span>
          </div>

          {/* Inline Save View Profile Form */}
          {isSavingProfile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'var(--bg-app)',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid var(--primary)',
                boxShadow: '0 4px 12px var(--primary-glow, rgba(79, 70, 229, 0.15))'
              }}
            >
              <Sparkles size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <input
                type="text"
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
                placeholder="Name this layout profile (e.g. Exam Mode, Minimal View)..."
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
                  fontSize: '0.73rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleSaveProfile}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.68rem',
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
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* =========================================================================
              C. INLINE MODULE CATALOG DRAWER (Instant Search & Toggle All 93 Modules)
              ========================================================================= */}
          {showModuleCatalog && (
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.55rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}
            >
              {/* Drawer Filter Header: Search Bar & Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
                  <Search
                    size={12}
                    style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    placeholder="Search modules (e.g. autogroup, kanban, rubric, pulse, lms)..."
                    style={{
                      width: '100%',
                      padding: '0.35rem 1.9rem 0.35rem 1.85rem',
                      fontSize: '0.74rem',
                      borderRadius: '7px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 150ms'
                    }}
                  />
                  {catalogSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearchQuery('')}
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
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Status Segmented Filter */}
                <div style={{ display: 'inline-flex', borderRadius: '7px', border: '1px solid var(--border-color)', overflow: 'hidden', backgroundColor: 'var(--bg-app)', padding: '2px', gap: '2px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setCatalogStatusFilter('all')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.68rem',
                      fontWeight: catalogStatusFilter === 'all' ? 800 : 500,
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: catalogStatusFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                      color: catalogStatusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: catalogStatusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                  >
                    All ({totalModules})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogStatusFilter('visible')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.68rem',
                      fontWeight: catalogStatusFilter === 'visible' ? 800 : 500,
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: catalogStatusFilter === 'visible' ? 'var(--accent-teal-light)' : 'transparent',
                      color: catalogStatusFilter === 'visible' ? 'var(--accent-teal)' : 'var(--text-muted)',
                      boxShadow: catalogStatusFilter === 'visible' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'all 120ms ease'
                    }}
                  >
                    <Eye size={10} />
                    <span>Visible ({visibleCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogStatusFilter('hidden')}
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.68rem',
                      fontWeight: catalogStatusFilter === 'hidden' ? 800 : 500,
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: catalogStatusFilter === 'hidden' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      color: catalogStatusFilter === 'hidden' ? 'var(--accent-rose, #ef4444)' : 'var(--text-muted)',
                      boxShadow: catalogStatusFilter === 'hidden' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'all 120ms ease'
                    }}
                  >
                    <EyeOff size={10} />
                    <span>Hidden ({hiddenCount})</span>
                  </button>
                </div>

                {/* Bulk Action Buttons */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      catalogFilteredItems.forEach(item => {
                        if (!featureToggles[item.key] && onToggleFeature) {
                          onToggleFeature(item.key, true);
                        }
                      });
                      onToast(`Restored all modules in current filter`, 'success');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.67rem', fontWeight: 650, borderRadius: '6px' }}
                    title="Make all modules in current filter visible"
                  >
                    <Plus size={10} /> Show All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      catalogFilteredItems.forEach(item => {
                        if (featureToggles[item.key] && onToggleFeature) {
                          onToggleFeature(item.key, false);
                        }
                      });
                      onToast(`Hidden all modules in current filter`, 'info');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.67rem', fontWeight: 650, borderRadius: '6px' }}
                    title="Hide all modules in current filter"
                  >
                    <EyeOff size={10} /> Hide All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModuleCatalog(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.67rem', fontWeight: 650, borderRadius: '6px', gap: '3px' }}
                    title="Collapse module catalog drawer"
                  >
                    <ChevronDown size={11} /> Collapse
                  </button>
                </div>
              </div>

              {/* Row 2: Comprehensive Section Category Filter Pills */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  overflowX: 'auto', 
                  paddingBottom: '2px',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {(
                  [
                    { id: 'all' as const, label: 'All Modules', count: totalModules, icon: Layers },
                    { id: 'header' as const, label: 'Header & Nav', count: sectionCounts.header.total, icon: Compass },
                    { id: 'hub' as const, label: 'Class Hub', count: sectionCounts.hub.total, icon: LayoutGrid },
                    { id: 'roster' as const, label: 'Enrollment & Roster', count: sectionCounts.roster.total, icon: Users },
                    { id: 'autogroup' as const, label: 'AutoGroup Studio', count: sectionCounts.autogroup.total, icon: Sparkles },
                    { id: 'rubric' as const, label: 'Rubric & Review', count: sectionCounts.rubric.total, icon: Sliders },
                    { id: 'analytics' as const, label: 'Grades & Reports', count: sectionCounts.analytics.total, icon: Award },
                    { id: 'footer' as const, label: 'Footer & Badges', count: sectionCounts.footer.total, icon: ShieldCheck }
                  ]
                ).map((cat) => {
                  const isSelected = catalogCategoryTab === cat.id;
                  const Icon = cat.icon;
                  const hasHiddenItems = cat.id === 'all'
                    ? hiddenCount > 0
                    : (sectionCounts[cat.id]?.total - sectionCounts[cat.id]?.visible > 0);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCatalogCategoryTab(cat.id)}
                      style={{
                        padding: '0.22rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: isSelected ? 800 : 550,
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                        transition: 'all 120ms ease'
                      }}
                    >
                      <Icon size={11} style={{ opacity: isSelected ? 1 : 0.75 }} />
                      <span>{cat.label}</span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          padding: '0 0.3rem',
                          borderRadius: '9999px',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                          fontWeight: 700
                        }}
                      >
                        {cat.count}
                      </span>
                      {hasHiddenItems && !isSelected && (
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent-amber, #f59e0b)', display: 'inline-block' }} title="Has hidden modules" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Result Summary Strip (When search is active or filtered) */}
              {(catalogSearchQuery || catalogCategoryTab !== 'all' || catalogStatusFilter !== 'all') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 0.2rem' }}>
                  <span>
                    Showing <strong>{catalogFilteredItems.length}</strong> matching modules
                    {catalogSearchQuery && ` for "${catalogSearchQuery}"`}
                    {catalogStatusFilter !== 'all' && ` (${catalogStatusFilter})`}
                  </span>
                  {(catalogSearchQuery || catalogCategoryTab !== 'all' || catalogStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearchQuery('');
                        setCatalogCategoryTab('all');
                        setCatalogStatusFilter('all');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, padding: 0 }}
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              )}

              {/* Row 4: Scrollable Module Cards Grid */}
              <div
                className="layout-studio-catalog-scroll"
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
                  gap: '0.45rem',
                  padding: '2px',
                  borderRadius: '8px'
                }}
              >
                {catalogFilteredItems.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.74rem', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                    <Search size={22} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                    <p style={{ margin: '0 0 0.4rem 0', fontWeight: 650, color: 'var(--text-primary)' }}>No matching modules found</p>
                    <p style={{ margin: 0, fontSize: '0.68rem' }}>Try clearing the search query or switching to &quot;All Modules&quot;.</p>
                  </div>
                ) : (
                  catalogFilteredItems.map((item) => {
                    const isVisible = !!featureToggles[item.key];
                    const Icon = item.icon || Layers;
                    const isSub = !!item.parentKey;
                    const parentModule = item.parentKey ? MODULE_ITEMS.find(m => m.key === item.parentKey) : null;
                    const parentTitle = parentModule ? parentModule.title.replace(/^AutoGroup:\s*/i, '').replace(/ Button| Card| Bar/gi, '').trim() : '';

                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggleModule(item.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.65rem',
                          padding: '0.52rem 0.75rem',
                          borderRadius: '9px',
                          border: isVisible ? '1px solid var(--border-color)' : '1px dashed var(--border-color)',
                          borderLeft: isVisible ? '3.5px solid var(--primary)' : '3.5px dashed var(--border-color)',
                          backgroundColor: isVisible ? 'var(--bg-surface)' : 'var(--bg-app)',
                          opacity: isVisible ? 1 : 0.75,
                          cursor: 'pointer',
                          transition: 'all 140ms ease',
                          boxShadow: isVisible ? '0 1px 4px rgba(0, 0, 0, 0.03)' : 'none'
                        }}
                        title={`Click to ${isVisible ? 'Hide' : 'Restore'}: "${item.title}"`}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              backgroundColor: isVisible ? 'var(--primary-light)' : 'rgba(107, 114, 128, 0.12)',
                              color: isVisible ? 'var(--primary)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}
                          >
                            <Icon size={13} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: 750, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                                {item.title}
                              </span>
                              {isSub && (
                                <span
                                  style={{
                                    fontSize: '0.58rem',
                                    padding: '0.05rem 0.35rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                    color: 'var(--primary)',
                                    fontWeight: 700,
                                    border: '1px solid rgba(99, 102, 241, 0.18)'
                                  }}
                                >
                                  ↳ {parentTitle || 'Submodule'}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        {/* Action Controls: Locate on Page + Direct Toggle Action Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToAndHighlightModule(item.key);
                              onToast(`Gliding to "${item.title}"...`, 'info');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.62rem',
                              padding: '0.15rem 0.45rem',
                              height: '22px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)'
                            }}
                            title={`Locate "${item.title}" on the page with smooth spotlight animation`}
                          >
                            <Compass size={11} className="text-teal" />
                            <span>Locate</span>
                          </button>

                          <div
                            style={{
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              backgroundColor: isVisible ? 'var(--accent-teal-light)' : 'rgba(107, 114, 128, 0.12)',
                              color: isVisible ? 'var(--accent-teal)' : 'var(--text-muted)',
                              border: isVisible ? '1px solid rgba(20, 184, 166, 0.35)' : '1px solid var(--border-color)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              flexShrink: 0,
                              transition: 'all 120ms ease'
                            }}
                          >
                            {isVisible ? <Check size={10} /> : <Plus size={10} />}
                            <span>{isVisible ? 'Visible' : 'Restore'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LayoutEditBar;
