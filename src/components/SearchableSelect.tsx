import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Globe } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  style?: React.CSSProperties;
  className?: string;
  triggerStyle?: React.CSSProperties;
  showIcon?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search countries / nationalities...',
  style,
  className = '',
  triggerStyle,
  showIcon = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value.toLowerCase() === (value || '').toLowerCase());

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchend', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchend', handleOutsideClick);
    };
  }, []);

  // Autofocus search input when dropdown opens (only on non-touch devices to avoid mobile keyboard jump)
  useEffect(() => {
    if (isOpen) {
      const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
      if (!isTouchDevice) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectOption = (optVal: string) => {
    onChange(optVal);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        type="button"
        className="form-select custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          width: '100%',
          paddingRight: '2.5rem',
          height: 'auto',
          minHeight: '44px',
          backgroundImage: 'none',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          ...triggerStyle
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {showIcon && <Globe size={15} style={{ color: value ? 'var(--accent-teal)' : 'var(--text-muted)', flexShrink: 0 }} />}
          <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: selectedOption ? 600 : 400 }}>
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
        </span>
        <ChevronDown
          size={16}
          className="custom-select-chevron"
          style={{
            position: 'absolute',
            right: '0.85rem',
            transition: 'transform 200ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            pointerEvents: 'none',
            color: 'var(--text-muted)'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="searchable-select-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-premium), 0 16px 36px -8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '240px'
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                className="form-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '2rem',
                  paddingRight: searchTerm ? '2rem' : '0.75rem',
                  fontSize: '0.85rem',
                  height: '36px',
                  backgroundColor: 'var(--bg-surface)'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem'
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={optionsListRef}
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No matching countries or nationalities found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value.toLowerCase() === (value || '').toLowerCase();
                return (
                  <button
                    key={option.value}
                    type="button"
                    className="custom-select-option"
                    onPointerDown={(e) => {
                      // Prevent input blur cancellation on mobile
                      e.stopPropagation();
                    }}
                    onClick={() => handleSelectOption(option.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      minHeight: '38px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 150ms ease',
                      touchAction: 'manipulation'
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
