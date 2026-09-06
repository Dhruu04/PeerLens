import React, { useState } from 'react';
import type { FeatureToggles } from '../utils/featurePreferences';
import { getModuleByKey, type ModuleSlotType } from '../utils/moduleRegistry';
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

  // Normal mode (Edit Mode is deactivated)
  if (!isEditMode) {
    if (isVisible) {
      return <>{children}</>;
    }
    return null;
  }

  // Look up metadata from module registry
  const meta = getModuleByKey(moduleKey);
  const title = customTitle || meta?.title || String(moduleKey);
  const slotType = customSlotType || meta?.slotType || 'card';
  const IconComponent = meta?.icon || Layers;
  const isSubmodule = !!meta?.parentKey || slotType === 'button' || inline;

  // Edit Mode: Module is currently VISIBLE -> Highlighted with 1-click Hide capability
  if (isVisible) {
    const isSmall = slotType === 'button' || inline;

    return (
      <div
        className={`edit-mode-slot edit-mode-slot-visible ${isSubmodule ? 'edit-mode-submodule' : ''} ${className}`}
        style={{
          position: 'relative',
          display: inline || isSmall ? 'inline-flex' : 'block',
          verticalAlign: inline || isSmall ? 'middle' : undefined,
          borderRadius: isSmall ? '8px' : '12px',
          outline: isHovered
            ? '2px dashed var(--accent-rose, #ef4444)'
            : isSubmodule
              ? '1.5px dashed var(--primary, #6366f1)'
              : '2px dashed rgba(99, 102, 241, 0.65)',
          outlineOffset: isSmall ? '1px' : '3px',
          transition: 'outline 150ms ease, transform 150ms ease',
          cursor: 'pointer',
          pointerEvents: 'auto',
          flexShrink: isSmall ? 0 : undefined,
          zIndex: isHovered ? (isSubmodule ? 40 : 25) : (isSubmodule ? 15 : undefined),
          ...style
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
          onToggle(moduleKey, false);
        }}
        title={`Click to Hide: "${title}"`}
      >
        {/* Real Content */}
        <div
          style={{
            pointerEvents: 'none',
            opacity: isHovered ? 0.6 : 1,
            transition: 'opacity 150ms ease',
            display: inline || isSmall ? 'inline-flex' : 'block',
            alignItems: inline || isSmall ? 'center' : undefined,
            width: inline || isSmall ? 'auto' : '100%'
          }}
        >
          {children}
        </div>

        {/* Floating Edit Mode Badge for cards & bars */}
        {!isSmall && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              zIndex: 30,
              backgroundColor: isHovered ? 'var(--accent-rose, #ef4444)' : 'var(--bg-surface)',
              color: isHovered ? '#ffffff' : 'var(--text-primary)',
              border: `1px solid ${isHovered ? 'var(--accent-rose, #ef4444)' : 'var(--border-color)'}`,
              padding: '0.2rem 0.55rem',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: 'var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.15))',
              pointerEvents: 'none',
              transition: 'all 150ms ease',
              backdropFilter: 'blur(8px)'
            }}
          >
            {isHovered ? (
              <>
                <EyeOff size={11} />
                <span>Click to Hide</span>
              </>
            ) : (
              <>
                <Eye size={11} style={{ color: 'var(--primary)' }} />
                <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>• Hide</span>
              </>
            )}
          </div>
        )}

        {/* Small button badge overlay */}
        {isSmall && isHovered && (
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
              zIndex: 45
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
  const defaultMinHeight = meta?.defaultHeight || (isButtonSlot ? 34 : isBarSlot ? 48 : 110);

  // For button slot or inline slot, get concise title for compact fitting
  const displayTitle = isButtonSlot || inline
    ? title.replace(/ Button| Action Icon| Selector| Indicator| Buttons/gi, '').trim()
    : title;

  return (
    <div
      className={`edit-mode-slot edit-mode-slot-hidden ${isSubmodule ? 'edit-mode-submodule-hidden' : ''} ${className}`}
      style={{
        position: 'relative',
        display: isButtonSlot || inline ? 'inline-flex' : 'flex',
        flexDirection: isButtonSlot || inline ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isButtonSlot || inline ? '0.35rem' : '0.45rem',
        minHeight: isButtonSlot || inline ? '34px' : `${defaultMinHeight}px`,
        height: isButtonSlot || inline ? (style.height || '36px') : undefined,
        padding: isButtonSlot || inline ? '0 0.65rem' : '1rem',
        borderRadius: isButtonSlot || inline ? '8px' : '12px',
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
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'none',
        userSelect: 'none',
        verticalAlign: isButtonSlot || inline ? 'middle' : undefined,
        flexShrink: 0,
        pointerEvents: 'auto',
        zIndex: 20,
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
      title={`Click to Show: "${title}"`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: isHovered ? 'var(--accent-teal, #059669)' : 'var(--text-secondary)'
        }}
      >
        <IconComponent size={isButtonSlot || inline ? 13 : 18} style={{ opacity: isHovered ? 1 : 0.8 }} />
        {isButtonSlot || inline ? (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            + {displayTitle.length > 20 ? displayTitle.slice(0, 19) + '…' : displayTitle}
          </span>
        ) : (
          <b style={{ fontSize: '0.8rem', color: isHovered ? 'var(--accent-teal, #059669)' : 'var(--text-secondary)' }}>
            {title}
          </b>
        )}
      </div>

      {!isButtonSlot && !inline && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isHovered ? 'var(--accent-teal, #10b981)' : 'var(--primary)',
            backgroundColor: isHovered ? 'var(--accent-teal-light, rgba(16, 185, 129, 0.15))' : 'var(--primary-light, rgba(79, 70, 229, 0.08))',
            padding: '0.2rem 0.65rem',
            borderRadius: '20px'
          }}
        >
          <Plus size={12} />
          <span>Click to Show Module</span>
        </div>
      )}
    </div>
  );
};
