import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Edit3, Check, X, BookmarkPlus, LayoutGrid, Users, Sliders, 
  Award, Keyboard, Sparkles, Lightbulb, GripVertical, 
  ChevronUp, ChevronDown, RotateCcw, Search, Plus, Layers, SlidersHorizontal,
  Eye, EyeOff, Compass, Bookmark
} from 'lucide-react';
import type { FeatureToggles } from '../utils/featurePreferences';
import { MODULE_ITEMS, type ModuleCategory, getTabForModuleCategory } from '../utils/moduleRegistry';
import { 
  saveCustomProfile, 
  deleteCustomProfile,
  getCustomProfiles, 
  subscribeCustomProfiles, 
  type CustomViewProfile 
} from '../utils/customViewProfiles';
import { CustomSelect, type CustomSelectOption } from './CustomSelect';

interface LayoutEditBarProps {
  isOpen: boolean;
  onClose: () => void;
  featureToggles: FeatureToggles;
  onToggleFeature?: (key: keyof FeatureToggles, value: boolean) => void;
  onApplyPreset: (preset: 'minimal' | 'standard' | 'full' | 'none') => void;
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
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  useEffect(() => {
    return subscribeCustomProfiles((list) => {
      setCustomProfiles(list);
    });
  }, []);

  // Undo Stack state for layout modifications (Ctrl+Z)
  const [undoStack, setUndoStack] = useState<Array<{ key: keyof FeatureToggles; prevVal: boolean; title: string }>>([]);

  useEffect(() => {
    const handleExternalToggle = (e: any) => {
      if (e.detail?.key) {
        setUndoStack(prev => {
          const last = prev[prev.length - 1];
          if (last && last.key === e.detail.key && last.prevVal === e.detail.prevVal) {
            return prev;
          }
          return [...prev.slice(-19), {
            key: e.detail.key,
            prevVal: e.detail.prevVal,
            title: e.detail.title || String(e.detail.key)
          }];
        });
      }
    };
    window.addEventListener('peerlens_module_toggled', handleExternalToggle);
    return () => window.removeEventListener('peerlens_module_toggled', handleExternalToggle);
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0 || !onToggleFeature) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    onToggleFeature(last.key, last.prevVal);
    onToast(`Undid change: "${last.title}" ${last.prevVal ? 'restored' : 'hidden'}`, 'info');
    scrollToAndHighlightModule(last.key);
  };

  // Keyboard shortcut: Ctrl+Z / Cmd+Z to immediately undo last layout toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        if (undoStack.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, onToggleFeature]);

  // Interactive Module Catalog Drawer
  const [showModuleCatalog, setShowModuleCatalog] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryTab, setCatalogCategoryTab] = useState<'all' | ModuleCategory>('all');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [catalogHierarchyFilter, setCatalogHierarchyFilter] = useState<'all' | 'parents' | 'submodules'>('all');

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
  const parentModulesCount = useMemo(() => MODULE_ITEMS.filter(m => !m.parentKey).length, []);
  const submodulesCount = totalModules - parentModulesCount;

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

      // 3. Hierarchy filter (Main vs Submodules)
      if (catalogHierarchyFilter === 'parents' && item.parentKey) return false;
      if (catalogHierarchyFilter === 'submodules' && !item.parentKey) return false;

      // 4. Search query
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
  }, [catalogSearchQuery, catalogCategoryTab, catalogStatusFilter, catalogHierarchyFilter, featureToggles]);

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

  const handleDeleteProfile = (profId: string) => {
    const prof = customProfiles.find(p => p.id === profId);
    deleteCustomProfile(profId);
    if (activeProfileId === profId) {
      setActiveProfileId('');
    }
    onToast(`Deleted view profile "${prof?.name || 'Custom View'}"`, 'info');
  };

  const handleApplyProfile = (profId: string) => {
    const p = customProfiles.find((cp) => cp.id === profId);
    if (p) {
      if (onToggleFeature) {
        Object.entries(p.toggles).forEach(([k, v]) => {
          onToggleFeature(k as keyof FeatureToggles, v);
        });
      }
      if (p.shortcutsEnabled !== undefined) {
        onToggleShortcutsEnabled(p.shortcutsEnabled);
      }
      setActiveProfileId(profId);
      onToast(`Applied view profile "${p.name}"`, 'success');
    }
  };

  const handleSaveProfile = (customName?: string) => {
    const trimmed = (customName !== undefined ? customName : profileNameInput).trim();
    if (!trimmed) {
      onToast('Please enter a profile name.', 'warning');
      return;
    }
    const saved = saveCustomProfile(trimmed, featureToggles, shortcutsEnabled);
    if (saved) {
      setActiveProfileId(saved.id);
      onToast(`Saved view profile "${trimmed}"!`, 'success');
      setProfileNameInput('');
      setIsSavingProfile(false);
    }
  };

  const profileOptions: CustomSelectOption[] = useMemo(() => {
    return customProfiles.map((p) => {
      const visCount = MODULE_ITEMS.filter((m) => !!p.toggles[m.key]).length;
      const formattedDate = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '';
      return {
        value: p.id,
        label: p.name,
        sublabel: `${visCount}/${totalModules} modules visible${formattedDate ? ` • ${formattedDate}` : ''}`,
        icon: <Bookmark size={13} style={{ color: activeProfileId === p.id ? 'var(--primary)' : 'var(--text-muted)' }} />,
        badge: `${Math.round((visCount / totalModules) * 100)}%`,
        deletable: true
      };
    });
  }, [customProfiles, totalModules, activeProfileId]);

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
    const currentVal = !!featureToggles[key];
    const nextVal = !currentVal;
    const item = MODULE_ITEMS.find((m) => m.key === key);
    const title = item?.title || key;

    // Track in undo stack
    setUndoStack(prev => [...prev.slice(-19), { key, prevVal: currentVal, title }]);

    onToggleFeature(key, nextVal);

    // QoL: If restoring a submodule whose parent container is hidden, automatically restore parent too!
    if (nextVal && item?.parentKey && !featureToggles[item.parentKey]) {
      onToggleFeature(item.parentKey, true);
    }

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
        maxWidth: embedded ? '100%' : (isExpanded ? '860px' : '620px'),
        minWidth: embedded ? 'auto' : '280px',
        backgroundColor: embedded ? 'transparent' : 'var(--bg-surface)',
        border: embedded ? 'none' : '1px solid var(--border-color)',
        borderRadius: embedded ? (isExpanded ? '16px' : '9999px') : (isExpanded ? '16px' : '9999px'),
        padding: embedded
          ? (isExpanded ? '0' : '0.22rem 0.45rem')
          : (isExpanded ? '0.65rem 0.95rem 0.55rem' : '0.3rem 0.45rem'),
        boxShadow: embedded ? 'none' : (isDragging
          ? '0 25px 50px rgba(0, 0, 0, 0.35), 0 0 20px var(--primary-glow)'
          : 'var(--shadow-premium, 0 16px 36px rgba(0, 0, 0, 0.18)), 0 0 16px var(--primary-glow, rgba(79, 70, 229, 0.15))'),
        display: 'flex',
        flexDirection: isExpanded ? 'column' : 'row',
        alignItems: isExpanded ? 'stretch' : 'center',
        gap: isExpanded ? '0.4rem' : '0.4rem',
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
            <button
              type="button"
              onClick={() => {
                onApplyPreset('none');
              }}
              style={{
                border: 'none',
                borderLeft: '1px solid var(--border-color)',
                padding: '0.2rem 0.45rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'transparent',
                color: visibleCount === 0 ? 'var(--accent-rose, #ef4444)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Hide All Modules: Workspace cleared"
            >
              <EyeOff size={10} style={{ opacity: 0.8 }} />
              <span>Hide All</span>
            </button>
          </div>

          {/* Quick Undo in Pill Mode */}
          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                height: '24px',
                padding: '0 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.68rem',
                fontWeight: 750,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 120ms ease'
              }}
              title={`Undo: "${undoStack[undoStack.length - 1].title}" (Ctrl+Z)`}
            >
              <RotateCcw size={10} style={{ color: 'var(--accent-amber)' }} />
              <span>Undo</span>
            </button>
          )}

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
            {/* Left: Studio Identity & Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--primary)',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  flexShrink: 0
                }}
              >
                <SlidersHorizontal size={13} />
                <span>Layout Studio</span>
              </div>
              <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>•</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{visibleCount}</strong>/{totalModules} visible
              </span>
            </div>

            {/* Center: Section Switcher Tabs */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-app)',
                padding: '2px',
                borderRadius: '7px',
                border: '1px solid var(--border-color)',
                gap: '2px',
                flexShrink: 0
              }}
            >
              {[
                { id: 'hub' as const, label: 'Hub', icon: LayoutGrid, count: sectionCounts.hub },
                { id: 'roster' as const, label: 'Enrollment', icon: Users, count: sectionCounts.roster },
                { id: 'grading' as const, label: 'Review', icon: Sliders, count: sectionCounts.rubric },
                { id: 'results' as const, label: 'Analytics', icon: Award, count: sectionCounts.analytics }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onNavigateTab(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.28rem',
                      padding: '0.18rem 0.5rem',
                      borderRadius: '5px',
                      border: 'none',
                      background: isActive ? 'var(--bg-surface)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 750 : 600,
                      cursor: 'pointer',
                      transition: 'all 120ms ease'
                    }}
                    title={`${tab.label} (${tab.count.visible}/${tab.count.total} visible)`}
                  >
                    <Icon size={11} style={{ opacity: isActive ? 1 : 0.7 }} />
                    <span>{tab.label}</span>
                    <span style={{ fontSize: '0.6rem', color: isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 650 }}>
                      {tab.count.visible}/{tab.count.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Done Editing & Collapse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-teal btn-sm"
                style={{
                  height: '26px',
                  padding: '0 0.75rem',
                  borderRadius: '7px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  gap: '0.25rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                }}
                title="Finish editing layout (Esc)"
              >
                <Check size={12} />
                <span>Done Editing</span>
              </button>

              <button
                type="button"
                onClick={() => toggleExpanded(false)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
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
                <ChevronDown size={13} />
              </button>
            </div>
          </div>

          {/* ROW 2: Presets (Left) | Module Catalog (Center) | Utilities (Right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              width: '100%',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.35rem',
              flexWrap: 'nowrap'
            }}
          >
            {/* Left: Density Presets Segmented Buttons */}
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', height: '24px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('minimal');
                  onToast('Applied Essentials preset', 'info');
                }}
                style={{
                  border: 'none',
                  padding: '0 0.5rem',
                  fontSize: '0.67rem',
                  fontWeight: visiblePercentage <= 30 ? 750 : 600,
                  background: visiblePercentage <= 30 ? 'var(--bg-surface)' : 'transparent',
                  color: visiblePercentage <= 30 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Essentials: Minimal layout"
              >
                Essentials
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('standard');
                  onToast('Restored Recommended layout', 'info');
                }}
                style={{
                  border: 'none',
                  borderLeft: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  padding: '0 0.5rem',
                  fontSize: '0.67rem',
                  fontWeight: visiblePercentage > 30 && visiblePercentage <= 75 ? 750 : 600,
                  background: visiblePercentage > 30 && visiblePercentage <= 75 ? 'var(--bg-surface)' : 'transparent',
                  color: visiblePercentage > 30 && visiblePercentage <= 75 ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Recommended: Balanced classroom layout"
              >
                Recommended
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('full');
                  onToast('Show All enabled: All modules visible', 'success');
                }}
                style={{
                  border: 'none',
                  borderRight: '1px solid var(--border-color)',
                  padding: '0 0.5rem',
                  fontSize: '0.67rem',
                  fontWeight: visiblePercentage > 75 ? 750 : 600,
                  background: visiblePercentage > 75 ? 'var(--bg-surface)' : 'transparent',
                  color: visiblePercentage > 75 ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title="Show All: Turn on all tools"
              >
                Show All
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyPreset('none');
                }}
                style={{
                  border: 'none',
                  padding: '0 0.45rem',
                  fontSize: '0.67rem',
                  fontWeight: visibleCount === 0 ? 750 : 600,
                  background: visibleCount === 0 ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                  color: visibleCount === 0 ? 'var(--accent-rose, #ef4444)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Hide All: Hide all modules from the layout"
              >
                <EyeOff size={10} style={{ opacity: 0.8 }} />
                <span>Hide All</span>
              </button>
            </div>

            {/* Center: Module Catalog Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowModuleCatalog(prev => !prev)}
                style={{
                  height: '24px',
                  padding: '0 0.6rem',
                  borderRadius: '6px',
                  border: showModuleCatalog ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: showModuleCatalog ? 'var(--primary-light)' : 'var(--bg-app)',
                  color: showModuleCatalog ? 'var(--primary)' : 'var(--text-primary)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.28rem',
                  transition: 'all 120ms ease'
                }}
                title="Search and toggle modules"
              >
                <Search size={11} />
                <span>Catalog ({totalModules})</span>
                <ChevronDown
                  size={11}
                  style={{
                    transform: showModuleCatalog ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms ease'
                  }}
                />
              </button>
            </div>

            {/* Right: Saved Views, Save, Shortcuts, Undo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              {/* Saved Profiles Dropdown */}
              <div style={{ minWidth: '135px' }}>
                <CustomSelect
                  value={activeProfileId}
                  onChange={handleApplyProfile}
                  options={profileOptions}
                  triggerLabel={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 650, fontSize: '0.67rem' }}>
                      <Bookmark size={11} style={{ color: customProfiles.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span>Saved Views ({customProfiles.length})</span>
                    </span>
                  }
                  dropdownAlign="right"
                  dropdownMinWidth="250px"
                  dropDirection="auto"
                  header={
                    <div style={{ padding: '0.25rem 0.4rem 0.3rem', fontSize: '0.64rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Saved Layout Views</span>
                      <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '9999px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', fontWeight: 700 }}>
                        {customProfiles.length}
                      </span>
                    </div>
                  }
                  footer={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSavingProfile(true);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '5px',
                        border: '1px dashed var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <BookmarkPlus size={11} />
                      <span>Save Current Layout</span>
                    </button>
                  }
                  emptyMessage={
                    <div style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      No saved views yet. Click &quot;Save&quot; to bookmark this layout!
                    </div>
                  }
                  onDeleteOption={handleDeleteProfile}
                  deleteTitle="Delete this saved view"
                  triggerStyle={{
                    height: '24px',
                    padding: '0 0.5rem',
                    fontSize: '0.67rem',
                    fontWeight: 650,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Save View Button */}
              <button
                type="button"
                onClick={() => setIsSavingProfile(prev => !prev)}
                style={{
                  height: '24px',
                  padding: '0 0.45rem',
                  fontSize: '0.67rem',
                  fontWeight: 650,
                  borderRadius: '6px',
                  border: isSavingProfile ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSavingProfile ? 'var(--primary)' : 'var(--bg-app)',
                  color: isSavingProfile ? '#ffffff' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  cursor: 'pointer',
                  transition: 'all 120ms ease'
                }}
                title="Save current layout as a view profile"
              >
                <BookmarkPlus size={11} />
                <span>Save</span>
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
                  height: '24px',
                  padding: '0 0.45rem',
                  fontSize: '0.67rem',
                  fontWeight: 650,
                  borderRadius: '6px',
                  border: shortcutsEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
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
                <span>{shortcutsEnabled ? 'Keys: ON' : 'Keys: OFF'}</span>
              </button>

              {/* Undo Button if available */}
              {undoStack.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndo}
                  style={{
                    height: '24px',
                    padding: '0 0.45rem',
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer'
                  }}
                  title={`Undo: "${undoStack[undoStack.length - 1].title}" (Ctrl+Z)`}
                >
                  <RotateCcw size={10} style={{ color: 'var(--accent-amber)' }} />
                  <span>Undo</span>
                </button>
              )}
            </div>
          </div>

          {/* ROW 3: Minimal Helper Hint Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.64rem',
              color: 'var(--text-muted)',
              userSelect: 'none',
              paddingTop: '0.1rem'
            }}
          >
            <Lightbulb size={10} style={{ color: 'var(--accent-amber)', opacity: 0.85 }} />
            <span>Click any module to hide • Click dashed slot to restore • Press <kbd style={{ padding: '0 4px', fontSize: '0.6rem', borderRadius: '3px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Esc</kbd> when finished</span>
          </div>

          {/* Inline Save View Profile Form */}
          {isSavingProfile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                backgroundColor: 'var(--bg-app)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--primary)',
                boxShadow: '0 4px 16px var(--primary-glow, rgba(79, 70, 229, 0.2))',
                animation: 'slideUp 180ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sparkles size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  placeholder="Name this layout profile (e.g. Exam Mode, Clean Desk)..."
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
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {visibleCount}/{totalModules} modules
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  style={{
                    padding: '0.22rem 0.65rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px var(--primary-glow, rgba(79, 70, 229, 0.3))'
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
                    padding: '3px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Cancel (Esc)"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Quick Preset Name Suggestions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', paddingTop: '2px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                  Suggestions:
                </span>
                {['Grading Focus', 'Presentation Mode', 'Minimal Roster', 'Analytics Studio'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setProfileNameInput(suggestion);
                      handleSaveProfile(suggestion);
                    }}
                    style={{
                      fontSize: '0.63rem',
                      fontWeight: 600,
                      padding: '0.12rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 120ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              C. INLINE MODULE CATALOG DRAWER (Minimal, Unified, Pro-Grade Layout)
              ========================================================================= */}
          {showModuleCatalog && (
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.45rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              {/* Single Unified Compact Filter Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between'
                }}
              >
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '150px' }}>
                  <Search
                    size={11}
                    style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    placeholder="Search modules..."
                    style={{
                      width: '100%',
                      height: '24px',
                      padding: '0 1.6rem 0 1.6rem',
                      fontSize: '0.7rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  {catalogSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '0.4rem',
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
                      <X size={11} />
                    </button>
                  )}
                </div>

                {/* Section Dropdown */}
                <select
                  value={catalogCategoryTab}
                  onChange={(e) => setCatalogCategoryTab(e.target.value as any)}
                  style={{
                    height: '24px',
                    padding: '0 0.45rem',
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    flexShrink: 0
                  }}
                >
                  <option value="all">All Sections ({totalModules})</option>
                  <option value="hub">Class Hub ({sectionCounts.hub.total})</option>
                  <option value="roster">Enrollment & Roster ({sectionCounts.roster.total})</option>
                  <option value="autogroup">AutoGroup Studio ({sectionCounts.autogroup.total})</option>
                  <option value="rubric">Rubric & Review ({sectionCounts.rubric.total})</option>
                  <option value="analytics">Grades & Reports ({sectionCounts.analytics.total})</option>
                  <option value="header">Header & Nav ({sectionCounts.header.total})</option>
                  <option value="footer">Footer & Badges ({sectionCounts.footer.total})</option>
                </select>

                {/* Hierarchy Dropdown */}
                <select
                  value={catalogHierarchyFilter}
                  onChange={(e) => setCatalogHierarchyFilter(e.target.value as any)}
                  style={{
                    height: '24px',
                    padding: '0 0.45rem',
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    flexShrink: 0
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="parents">Containers ({parentModulesCount})</option>
                  <option value="submodules">Submodules ({submodulesCount})</option>
                </select>

                {/* Status Segmented Filter */}
                <div style={{ display: 'inline-flex', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden', backgroundColor: 'var(--bg-app)', height: '24px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setCatalogStatusFilter('all')}
                    style={{
                      padding: '0 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: catalogStatusFilter === 'all' ? 750 : 550,
                      border: 'none',
                      backgroundColor: catalogStatusFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                      color: catalogStatusFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    All ({totalModules})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogStatusFilter('visible')}
                    style={{
                      padding: '0 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: catalogStatusFilter === 'visible' ? 750 : 550,
                      border: 'none',
                      borderLeft: '1px solid var(--border-color)',
                      borderRight: '1px solid var(--border-color)',
                      backgroundColor: catalogStatusFilter === 'visible' ? 'var(--accent-teal-light)' : 'transparent',
                      color: catalogStatusFilter === 'visible' ? 'var(--accent-teal)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Eye size={10} />
                    <span>{visibleCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogStatusFilter('hidden')}
                    style={{
                      padding: '0 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: catalogStatusFilter === 'hidden' ? 750 : 550,
                      border: 'none',
                      backgroundColor: catalogStatusFilter === 'hidden' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      color: catalogStatusFilter === 'hidden' ? 'var(--accent-rose, #ef4444)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <EyeOff size={10} />
                    <span>{hiddenCount}</span>
                  </button>
                </div>

                {/* Close Catalog */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowModuleCatalog(false)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '5px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 120ms ease'
                    }}
                    title="Close module catalog"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Active Filter Summary Strip (Only when filters are active) */}
              {(catalogSearchQuery || catalogCategoryTab !== 'all' || catalogStatusFilter !== 'all' || catalogHierarchyFilter !== 'all') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0 0.2rem' }}>
                  <span>
                    Showing <strong>{catalogFilteredItems.length}</strong> matching modules
                    {catalogSearchQuery && ` for "${catalogSearchQuery}"`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearchQuery('');
                      setCatalogCategoryTab('all');
                      setCatalogStatusFilter('all');
                      setCatalogHierarchyFilter('all');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, padding: 0 }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* Scrollable Module Cards Grid */}
              <div
                className="layout-studio-catalog-scroll"
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '0.45rem',
                  padding: '2px',
                  borderRadius: '6px'
                }}
              >
                {catalogFilteredItems.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.72rem', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <Search size={18} style={{ margin: '0 auto 0.4rem auto', opacity: 0.5 }} />
                    <p style={{ margin: '0 0 0.2rem 0', fontWeight: 650, color: 'var(--text-primary)' }}>No matching modules found</p>
                    <p style={{ margin: 0, fontSize: '0.66rem' }}>Try clearing the search query or resetting filters.</p>
                  </div>
                ) : (
                  catalogFilteredItems.map((item) => {
                    const isVisible = !!featureToggles[item.key];
                    const Icon = item.icon || Layers;
                    const isSub = !!item.parentKey;
                    const parentModule = item.parentKey ? MODULE_ITEMS.find(m => m.key === item.parentKey) : null;
                    const parentTitle = parentModule ? parentModule.title.replace(/^AutoGroup:\s*/i, '').replace(/ Button| Card| Bar/gi, '').trim() : '';
                    const cleanParentLabel = parentTitle ? (parentTitle.length > 20 ? parentTitle.slice(0, 18) + '…' : parentTitle) : 'Sub';

                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggleModule(item.key)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '8px',
                          border: isVisible ? '1px solid var(--border-color)' : '1px dashed var(--border-color)',
                          backgroundColor: isVisible ? 'var(--bg-surface)' : 'var(--bg-app)',
                          opacity: isVisible ? 1 : 0.72,
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                          boxShadow: isVisible ? '0 1px 3px rgba(0,0,0,0.02)' : 'none',
                          minHeight: '62px'
                        }}
                        title={`Click to ${isVisible ? 'Hide' : 'Show'}: "${item.title}"\n${item.desc}`}
                      >
                        {/* Header: Icon + Title + Actions */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.45rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                backgroundColor: isVisible ? 'var(--primary-light)' : 'rgba(107, 114, 128, 0.08)',
                                color: isVisible ? 'var(--primary)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: '1px'
                              }}
                            >
                              <Icon size={12} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    color: isVisible ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    lineHeight: 1.25,
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {item.title}
                                </span>
                                {isSub && (
                                  <span
                                    style={{
                                      fontSize: '0.58rem',
                                      padding: '0.05rem 0.32rem',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--primary-light)',
                                      color: 'var(--primary)',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={`Submodule of ${parentModule?.title || 'Parent Container'}`}
                                  >
                                    ↳ {cleanParentLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Controls: Locate & Status Toggle Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToAndHighlightModule(item.key);
                                onToast(`Gliding to "${item.title}"...`, 'info');
                              }}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-app)',
                                color: 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 120ms ease'
                              }}
                              title={`Locate "${item.title}" on page`}
                            >
                              <Compass size={11} />
                            </button>

                            <div
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                                backgroundColor: isVisible ? 'var(--accent-teal-light)' : 'rgba(107, 114, 128, 0.08)',
                                color: isVisible ? 'var(--accent-teal)' : 'var(--text-muted)',
                                border: isVisible ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid var(--border-color)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                flexShrink: 0
                              }}
                            >
                              {isVisible ? <Check size={9} /> : <Plus size={9} />}
                              <span>{isVisible ? 'On' : 'Off'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description: 2-line clamp with high legibility */}
                        <div
                          style={{
                            fontSize: '0.67rem',
                            color: isVisible ? 'var(--text-secondary)' : 'var(--text-muted)',
                            lineHeight: 1.35,
                            paddingLeft: '28px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {item.desc}
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
