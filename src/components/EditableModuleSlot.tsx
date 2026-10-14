import React, { useState } from 'react';
import type { FeatureToggles } from '../utils/featurePreferences';
import { getModuleByKey, hasSubmodules, type ModuleSlotType } from '../utils/moduleRegistry';
import { Eye, EyeOff, Plus, Layers } from 'lucide-react';

interface EditableModuleSlotProps {
  moduleKey: keyof FeatureToggles;
  isEditMode: boolean;
  isVisible: boolean;
  onToggle: (key: keyof FeatureToggles, nextVisible: boolean) => void;
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
  children,
  title: customTitle,
  slotType: customSlotType,
  className = '',
  style = {},
  placeholderStyle = {},
  inline = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);

  // Normal mode (Edit Mode is deactivated)
  if (!isEditMode) {
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

  // Look up metadata from module registry
  const meta = getModuleByKey(moduleKey);
  const rawTitle = customTitle || meta?.title || String(moduleKey);
  const slotType = customSlotType || meta?.slotType || 'card';
  const IconComponent = meta?.icon || Layers;
  const isSubmodule = !!meta?.parentKey || slotType === 'button' || inline;
  const isContainerWithSubmodules = hasSubmodules(moduleKey);

  // Clean title for badge display: strip redundant prefixes that bloat width and cover content
  const cleanBadgeTitle = rawTitle
    .replace(/^AutoGroup:\s*/i, '')
    .replace(/^Section \d+:\s*/i, '')
    .replace(/ Button| Action Icon| Selector| Indicator| Buttons/gi, '')
    .trim();

  // Edit Mode: Module is currently VISIBLE -> Highlighted with attached tab badge
  if (isVisible) {
    const isFloatingBadge = !inline && slotType !== 'button';

    return (
      <div
        data-module-key={moduleKey}
        id={`module-slot-${moduleKey}`}
        className={`edit-mode-slot edit-mode-slot-visible ${isSubmodule ? 'edit-mode-submodule' : ''} ${className}`}
        style={{
          position: 'relative',
          display: inline ? 'inline-flex' : 'flex',
          flexDirection: 'column',
          width: inline ? 'auto' : '100%',
          boxSizing: 'border-box',
          verticalAlign: inline ? 'middle' : undefined,
          borderRadius: slotType === 'button' || inline ? '8px' : '12px',
          outline: isHovered
            ? (isContainerWithSubmodules ? '2px dashed var(--primary, #6366f1)' : '2px dashed var(--accent-rose, #ef4444)')
            : isSubmodule
              ? '1.5px dashed var(--primary, #6366f1)'
              : '2px dashed rgba(99, 102, 241, 0.65)',
          outlineOffset: slotType === 'button' || inline ? '1px' : '3px',
          transition: 'outline 150ms ease, box-shadow 150ms ease',
          cursor: isContainerWithSubmodules ? 'default' : 'pointer',
          pointerEvents: 'auto',
          flexShrink: inline ? 0 : undefined,
          zIndex: isHovered ? (isSubmodule ? 50 : 30) : (isSubmodule ? 20 : undefined),
          overflow: 'visible',
          marginTop: isFloatingBadge ? (isSubmodule ? '10px' : '6px') : undefined,
          ...style
        }}
        onMouseEnter={(e) => {
          if (!isContainerWithSubmodules) {
            e.stopPropagation();
            setIsHovered(true);
          }
        }}
        onMouseLeave={(e) => {
          if (!isContainerWithSubmodules) {
            e.stopPropagation();
            setIsHovered(false);
          }
        }}
        onClick={(e) => {
          if (!isContainerWithSubmodules && !isFloatingBadge) {
            e.preventDefault();
            e.stopPropagation();
            onToggle(moduleKey, false);
          }
        }}
        title={isContainerWithSubmodules || isFloatingBadge ? rawTitle : `Click to Hide: "${rawTitle}"`}
      >
        {/* Real Content */}
        <div
          style={{
            pointerEvents: (isContainerWithSubmodules || isFloatingBadge) ? 'auto' : 'none',
            opacity: (!isContainerWithSubmodules && !isFloatingBadge && isHovered) ? 0.65 : 1,
            transition: 'opacity 150ms ease',
            display: inline ? 'inline-flex' : 'flex',
            flexDirection: 'column',
            width: inline ? 'auto' : '100%',
            boxSizing: 'border-box',
            flex: inline ? undefined : 1
          }}
        >
          {children}
        </div>

        {/* Attached Border Tab Badge for cards, bars & submodules (sitting ON the top border line, NEVER covering text) */}
        {isFloatingBadge && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(moduleKey, false);
            }}
            onMouseEnter={() => {
              setIsBadgeHovered(true);
              setIsHovered(true);
            }}
            onMouseLeave={() => {
              setIsBadgeHovered(false);
              setIsHovered(false);
            }}
            style={{
              position: 'absolute',
              top: '-11px',
              right: isContainerWithSubmodules ? 'auto' : (isSubmodule ? '14px' : '16px'),
              left: isContainerWithSubmodules ? '16px' : 'auto',
              zIndex: 1000,
              backgroundColor: isBadgeHovered ? 'var(--accent-rose, #ef4444)' : 'var(--bg-surface)',
              color: isBadgeHovered ? '#ffffff' : 'var(--text-primary)',
              border: `1px solid ${isBadgeHovered ? 'var(--accent-rose, #ef4444)' : 'var(--border-color)'}`,
              padding: '0.12rem 0.55rem',
              borderRadius: '20px',
              fontSize: '0.66rem',
              fontWeight: 750,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: isBadgeHovered
                ? '0 4px 12px rgba(239, 68, 68, 0.35)'
                : '0 2px 8px rgba(0, 0, 0, 0.12)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'all 140ms ease',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              height: '21px',
              whiteSpace: 'nowrap'
            }}
            title={`Click to Hide: "${rawTitle}"`}
          >
            {isBadgeHovered ? (
              <>
                <EyeOff size={10} />
                <span>Hide {cleanBadgeTitle.length > 20 ? cleanBadgeTitle.slice(0, 19) + '…' : cleanBadgeTitle}</span>
              </>
            ) : (
              <>
                <Eye size={10} style={{ color: 'var(--primary)' }} />
                <span style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cleanBadgeTitle}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 600 }}>• Hide</span>
              </>
            )}
          </button>
        )}

        {/* Small button corner badge on hover */}
        {!isFloatingBadge && isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '-7px',
              right: '-7px',
              backgroundColor: 'var(--accent-rose, #ef4444)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              zIndex: 1000
            }}
          >
            <EyeOff size={10} />
          </div>
        )}
      </div>
    );
  }

  // Edit Mode: Module is currently HIDDEN -> Render Empty Space Highlighted Placeholder with 1-click Show
  const isButtonSlot = slotType === 'button';
  const isBarSlot = slotType === 'bar' || slotType === 'banner';
  const defaultMinHeight = meta?.defaultHeight || (isButtonSlot ? 34 : isBarSlot ? 48 : 100);

  return (
    <div
      data-module-key={moduleKey}
      id={`module-slot-${moduleKey}`}
      className={`edit-mode-slot edit-mode-slot-hidden ${isSubmodule ? 'edit-mode-submodule-hidden' : ''} ${className}`}
      style={{
        position: 'relative',
        display: inline ? 'inline-flex' : 'flex',
        flexDirection: inline ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: inline ? '0.35rem' : '0.45rem',
        minHeight: inline ? '34px' : (isButtonSlot ? '36px' : isBarSlot ? '48px' : `${defaultMinHeight}px`),
        height: isButtonSlot ? (style.height || '36px') : undefined,
        padding: inline ? '0 0.65rem' : (isButtonSlot ? '0.45rem 0.65rem' : '0.85rem 1rem'),
        borderRadius: inline || isButtonSlot ? '8px' : '12px',
        width: inline ? 'auto' : '100%',
        boxSizing: 'border-box',
        border: isHovered
          ? '1.5px dashed var(--accent-teal, #10b981)'
          : isSubmodule
            ? '1.5px dashed var(--accent-teal, #14b8a6)'
            : '1.5px dashed var(--border-color)',
        backgroundColor: isHovered
          ? 'var(--accent-teal-light, rgba(16, 185, 129, 0.1))'
          : isSubmodule
            ? 'var(--bg-app)'
            : 'var(--bg-surface-hover, rgba(0, 0, 0, 0.02))',
        cursor: 'pointer',
        transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.008)' : 'scale(1)',
        boxShadow: isHovered ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none',
        userSelect: 'none',
        verticalAlign: inline ? 'middle' : undefined,
        flexShrink: inline ? 0 : undefined,
        pointerEvents: 'auto',
        zIndex: 20,
        marginTop: isSubmodule ? '4px' : undefined,
        marginBottom: isSubmodule ? '4px' : undefined,
        ...style,
        ...placeholderStyle
      }}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(moduleKey, true);
      }}
      title={`Click to Show: "${rawTitle}"`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: isHovered ? 'var(--accent-teal, #059669)' : 'var(--text-secondary)'
        }}
      >
        <IconComponent size={isButtonSlot || inline ? 13 : 16} style={{ opacity: isHovered ? 1 : 0.8 }} />
        {isButtonSlot || inline ? (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            + {cleanBadgeTitle.length > 20 ? cleanBadgeTitle.slice(0, 19) + '…' : cleanBadgeTitle}
          </span>
        ) : (
          <b style={{ fontSize: '0.78rem', color: isHovered ? 'var(--accent-teal, #059669)' : 'var(--text-secondary)' }}>
            {cleanBadgeTitle}
          </b>
        )}
      </div>

      {!isButtonSlot && !inline && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: isHovered ? 'var(--accent-teal, #10b981)' : 'var(--primary)',
            backgroundColor: isHovered ? 'var(--accent-teal-light, rgba(16, 185, 129, 0.15))' : 'var(--primary-light, rgba(79, 70, 229, 0.08))',
            padding: '0.15rem 0.55rem',
            borderRadius: '20px'
          }}
        >
          <Plus size={11} />
          <span>Click to Show Module</span>
        </div>
      )}
    </div>
  );
};
