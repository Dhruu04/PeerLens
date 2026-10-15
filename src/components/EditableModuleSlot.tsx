import React from 'react';
import type { FeatureToggles } from '../utils/featurePreferences';
import { getModuleByKey, type ModuleSlotType } from '../utils/moduleRegistry';
import { EyeOff, Plus, Layers } from 'lucide-react';

export interface EditModeContextType {
  isEditMode: boolean;
  featureToggles: FeatureToggles;
  onToggle: (key: keyof FeatureToggles, nextVisible: boolean) => void;
}

export const EditModeContext = React.createContext<EditModeContextType | null>(null);

interface EditableModuleSlotProps {
  moduleKey: keyof FeatureToggles;
  isEditMode: boolean;
  isVisible: boolean;
  onToggle: (key: keyof FeatureToggles, nextVisible: boolean) => void;
  featureToggles?: FeatureToggles;
  children?: React.ReactNode;
  title?: string;
  slotType?: ModuleSlotType;
  className?: string;
  style?: React.CSSProperties;
  placeholderStyle?: React.CSSProperties;
  inline?: boolean;
}

export const EditableModuleSlot: React.FC<EditableModuleSlotProps> = ({
  moduleKey,
  isEditMode,
  isVisible,
  onToggle,
  featureToggles: _customToggles,
  children,
  title: customTitle,
  slotType: customSlotType,
  className = '',
  style = {},
  placeholderStyle = {},
  inline = false
}) => {
  const context = React.useContext(EditModeContext);
  const effectiveIsEditMode = isEditMode !== undefined ? isEditMode : (context?.isEditMode ?? false);
  const effectiveOnToggle = onToggle || context?.onToggle;

  // Edit Mode Active: Look up metadata
  const meta = getModuleByKey(moduleKey);
  const rawTitle = customTitle || meta?.title || String(moduleKey);
  const slotType = customSlotType || meta?.slotType || 'card';
  const IconComponent = meta?.icon || Layers;
  const isSubmodule = !!meta?.parentKey || slotType === 'button' || inline;

  // Clean title for badge display: strip redundant prefixes that bloat width
  const cleanBadgeTitle = rawTitle
    .replace(/^AutoGroup:\s*/i, '')
    .replace(/^Section \d+:\s*/i, '')
    .replace(/ Button| Action Icon| Selector| Indicator| Buttons/gi, '')
    .trim();

  const handleToggle = (key: keyof FeatureToggles, nextVisible: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent('peerlens_module_toggled', {
          detail: {
            key,
            prevVal: !nextVisible,
            title: getModuleByKey(key)?.title || String(key)
          }
        })
      );
    } catch (e) { }
    if (effectiveOnToggle) {
      effectiveOnToggle(key, nextVisible);
    }
  };

  // Normal mode (Edit Mode deactivated) -> Zero overhead, normal DOM rendering
  if (!effectiveIsEditMode) {
    if (isVisible) {
      return (
        <div
          data-module-key={moduleKey}
          id={`module-slot-${moduleKey}`}
          className={`module-slot-host ${className}`}
          style={{ display: 'contents' }}
        >
          {children}
        </div>
      );
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // A. VISIBLE SLOT (Module is currently ON / active)
  // --------------------------------------------------------------------------
  if (isVisible) {
    const isFloatingBadge = !inline && slotType !== 'button';

    return (
      <div
        data-module-key={moduleKey}
        id={`module-slot-${moduleKey}`}
        className={`module-slot-host edit-mode-slot edit-mode-slot-visible ${isSubmodule ? 'edit-mode-submodule' : ''} ${className}`}
        style={{
          display: inline ? 'inline-flex' : 'flex',
          flexDirection: 'column',
          width: inline ? 'auto' : '100%',
          boxSizing: 'border-box',
          verticalAlign: inline ? 'middle' : undefined,
          borderRadius: slotType === 'button' || inline ? '8px' : '12px',
          outlineOffset: slotType === 'button' || inline ? '1px' : '2px',
          pointerEvents: 'auto',
          flexShrink: inline ? 0 : undefined,
          overflow: 'visible',
          marginTop: isFloatingBadge ? (isSubmodule ? '6px' : '4px') : undefined,
          ...style
        }}
      >
        {children}

        {/* 1. Attached Border Tab Badge for Parent Containers & Cards */}
        {isFloatingBadge && (
          <button
            type="button"
            className="edit-slot-badge"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggle(moduleKey, false);
            }}
            style={{
              right: isSubmodule ? '12px' : '14px',
              left: 'auto'
            }}
            title={`Click to Hide: "${rawTitle}"`}
          >
            <IconComponent size={10} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cleanBadgeTitle}
            </span>
            <span className="badge-hide-chip">
              <EyeOff size={9} />
              <span>Hide</span>
            </span>
          </button>
        )}

        {/* 2. Sleek Micro Hover Hide Action for Submodules & Button Slots (100% CSS driven) */}
        {!isFloatingBadge && (
          <button
            type="button"
            className="edit-submodule-micro-action"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggle(moduleKey, false);
            }}
            title={`Click to Hide: "${rawTitle}"`}
          >
            <EyeOff size={9} />
            <span>Hide</span>
          </button>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // B. HIDDEN SLOT (Module is currently OFF / placeholder)
  // --------------------------------------------------------------------------
  const isButtonSlot = slotType === 'button';
  const isBarSlot = slotType === 'bar' || slotType === 'banner';
  const defaultMinHeight = isButtonSlot ? 32 : isBarSlot ? 42 : Math.min(meta?.defaultHeight || 72, 72);

  // B1. Inline / Button Submodule Hidden Ghost Slot (Fits inline seamlessly)
  if (isButtonSlot || inline) {
    return (
      <div
        data-module-key={moduleKey}
        id={`module-slot-${moduleKey}`}
        className={`edit-mode-slot edit-mode-slot-hidden edit-mode-submodule-hidden ${className}`}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggle(moduleKey, true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            handleToggle(moduleKey, true);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          height: '32px',
          minHeight: '32px',
          padding: '0 0.6rem',
          borderRadius: '7px',
          width: 'auto',
          boxSizing: 'border-box',
          cursor: 'pointer',
          userSelect: 'none',
          verticalAlign: 'middle',
          flexShrink: 0,
          pointerEvents: 'auto',
          zIndex: 20,
          ...style,
          ...placeholderStyle
        }}
        title={`Click to Restore: "${rawTitle}"`}
      >
        <Plus size={11} className="hidden-slot-icon" style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span className="hidden-slot-title" style={{ fontSize: '0.7rem', fontWeight: 650, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
          {cleanBadgeTitle}
        </span>
      </div>
    );
  }

  // B2. Card / Container / Bar Slot Blueprint Placeholder
  return (
    <div
      data-module-key={moduleKey}
      id={`module-slot-${moduleKey}`}
      className={`edit-mode-slot edit-mode-slot-hidden ${isSubmodule ? 'edit-mode-submodule-hidden' : ''} ${className}`}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle(moduleKey, true);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleToggle(moduleKey, true);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.65rem',
        minHeight: `${defaultMinHeight}px`,
        padding: '0.65rem 0.95rem',
        borderRadius: '10px',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        touchAction: 'manipulation',
        userSelect: 'none',
        pointerEvents: 'auto',
        zIndex: 20,
        marginTop: isSubmodule ? '3px' : '5px',
        marginBottom: isSubmodule ? '3px' : '5px',
        ...style,
        ...placeholderStyle
      }}
      title={`Click to Restore: "${rawTitle}"`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1, pointerEvents: 'none' }}>
        <div
          className="hidden-slot-icon-box"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.1s ease'
          }}
        >
          <IconComponent size={13} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span
              className="hidden-slot-title"
              style={{
                fontSize: '0.76rem',
                fontWeight: 650,
                color: 'var(--text-secondary)',
                lineHeight: 1.25,
                transition: 'color 0.1s ease'
              }}
            >
              {cleanBadgeTitle}
            </span>
            {isSubmodule && (
              <span
                style={{
                  fontSize: '0.58rem',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600
                }}
              >
                ↳ Submodule
              </span>
            )}
          </div>
          {meta?.desc && (
            <span
              style={{
                fontSize: '0.64rem',
                color: 'var(--text-muted)',
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '420px',
                marginTop: '1px'
              }}
            >
              {meta.desc}
            </span>
          )}
        </div>
      </div>

      <div
        className="hidden-slot-restore-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.66rem',
          fontWeight: 700,
          pointerEvents: 'none',
          color: 'var(--primary)',
          backgroundColor: 'var(--primary-light, rgba(99, 102, 241, 0.08))',
          padding: '0.2rem 0.55rem',
          borderRadius: '6px',
          border: '1px solid transparent',
          flexShrink: 0,
          transition: 'all 0.1s ease'
        }}
      >
        <Plus size={10} />
        <span>Restore</span>
      </div>
    </div>
  );
};

export default EditableModuleSlot;
