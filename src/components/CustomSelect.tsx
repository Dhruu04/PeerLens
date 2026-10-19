import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  deletable?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  triggerLabel?: React.ReactNode;
  triggerIcon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  triggerStyle?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
  dropdownAlign?: 'left' | 'right';
  dropdownMinWidth?: string;
  dropdownMaxWidth?: string;
  dropDirection?: 'up' | 'down' | 'auto';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  onDeleteOption?: (value: string, e: React.MouseEvent) => void;
  deleteTitle?: string;
  disabled?: boolean;
  title?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  triggerLabel,
  triggerIcon,
  style,
  className = '',
  triggerStyle,
  dropdownStyle,
  dropdownAlign = 'left',
  dropdownMinWidth,
  dropdownMaxWidth,
  dropDirection = 'auto',
  header,
  footer,
  emptyMessage,
  onDeleteOption,
  deleteTitle,
  disabled = false,
  title
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropUp, setIsDropUp] = useState(dropDirection === 'up');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  let displayText: React.ReactNode;
  if (triggerLabel !== undefined) {
    displayText = triggerLabel;
  } else if (selectedOption) {
    displayText = selectedOption.label;
  } else if (placeholder !== undefined) {
    displayText = placeholder;
  } else {
    displayText = options[0]?.label || '';
  }

  const effectiveIcon = triggerIcon !== undefined ? triggerIcon : (triggerLabel !== undefined ? null : selectedOption?.icon);

  // Calculate drop direction when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (dropDirection === 'up') {
        setIsDropUp(true);
      } else if (dropDirection === 'down') {
        setIsDropUp(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setIsDropUp(spaceBelow < 250 && spaceAbove > spaceBelow);
      }
    }
  }, [isOpen, dropDirection]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const dropdownTop = isDropUp ? 'auto' : 'calc(100% + 5px)';
  const dropdownBottom = isDropUp ? 'calc(100% + 5px)' : 'auto';

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{ position: 'relative', display: 'inline-block', width: '100%', zIndex: isOpen ? 99999 : 'auto', ...style }}
    >
      <button
        type="button"
        className="form-select custom-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={title}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          textAlign: 'left',
          width: '100%',
          padding: '0.35rem 0.65rem',
          height: 'auto',
          backgroundImage: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxSizing: 'border-box',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm, 6px)',
          ...triggerStyle
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
          {effectiveIcon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{effectiveIcon}</span>}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'inherit' }}>
            {displayText}
          </span>
        </span>
        <ChevronDown
          size={13}
          className="custom-select-chevron"
          style={{
            flexShrink: 0,
            marginLeft: 'auto',
            color: 'var(--text-muted)',
            transition: 'transform 200ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            pointerEvents: 'none'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: dropdownTop,
            bottom: dropdownBottom,
            left: dropdownAlign === 'right' ? 'auto' : 0,
            right: dropdownAlign === 'right' ? 0 : 'auto',
            minWidth: dropdownMinWidth || (dropdownAlign === 'right' ? 'max-content' : '100%'),
            maxWidth: dropdownMaxWidth || '340px',
            zIndex: 99999,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 14px 32px -4px rgba(0, 0, 0, 0.22), 0 6px 12px -2px rgba(0, 0, 0, 0.12)',
            maxHeight: '260px',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '5px',
            animation: 'slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            ...dropdownStyle
          }}
        >
          {header && (
            <div style={{ padding: '0.2rem 0.25rem 0.4rem 0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
              {header}
            </div>
          )}

          {options.length === 0 ? (
            <div
              style={{
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}
            >
              {emptyMessage || 'No options available'}
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 'var(--radius-sm, 6px)',
                    backgroundColor: isSelected ? 'var(--primary-light, rgba(99, 102, 241, 0.12))' : 'transparent',
                    color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast, 120ms ease)',
                    lineHeight: 1.35,
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                    {option.icon && (
                      <span style={{ display: 'inline-flex', flexShrink: 0, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        {option.icon}
                      </span>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {option.label}
                      </span>
                      {option.sublabel && (
                        <span
                          style={{
                            fontSize: '0.67rem',
                            color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                            opacity: 0.88,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    {option.badge && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontFamily: 'monospace',
                          color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      >
                        {option.badge}
                      </span>
                    )}

                    {onDeleteOption && option.deletable !== false && (
                      <button
                        type="button"
                        title={deleteTitle || 'Delete'}
                        aria-label={`Delete ${option.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDeleteOption(option.value, e);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '22px',
                          height: '22px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                          flexShrink: 0,
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                          e.currentTarget.style.color = 'var(--accent-red, #ef4444)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {footer && (
            <div
              style={{
                marginTop: '4px',
                padding: '0.45rem 0.5rem 0.2rem 0.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
