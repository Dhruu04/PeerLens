import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  style?: React.CSSProperties;
  className?: string;
  triggerStyle?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  style,
  className = '',
  triggerStyle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

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

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{ position: 'relative', display: 'block', width: '100%', ...style }}
    >
      <button
        type="button"
        className="form-select custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          textAlign: 'left',
          width: '100%',
          padding: '0.45rem 0.85rem',
          height: 'auto',
          backgroundImage: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box',
          ...triggerStyle
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
          {selectedOption?.label}
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
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: '100%',
            zIndex: 9999,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.14), 0 8px 10px -4px rgba(0, 0, 0, 0.08)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
            animation: 'slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  lineHeight: 1.35
                }}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
