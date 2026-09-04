import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = () => {
  const { 
    themeMode, 
    effectiveTheme, 
    accentColor, 
    setThemeMode, 
    setAccentColor, 
    accentOptions 
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeAccent = accentOptions.find(a => a.id === accentColor) || accentOptions[0];

  // 1-Click Instant Theme Toggle
  const handleToggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (themeMode === 'system') {
      setThemeMode(effectiveTheme === 'dark' ? 'light' : 'dark');
    } else {
      setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }
  };

  // Unified 1-click icon dock button matching Settings & Customize View
  return (
    <div className="theme-toggle-wrapper" ref={popoverRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm dock-btn"
        onClick={handleToggleTheme}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode (Current: ${effectiveTheme === 'dark' ? 'Dark' : 'Light'}) • Right-click for palette`}
        aria-label="Toggle light and dark theme"
        style={{
          width: '34px',
          height: '32px',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {effectiveTheme === 'dark' ? (
          <Sun size={15} className="text-primary" />
        ) : (
          <Moon size={15} className="text-primary" />
        )}
      </button>

      {/* Floating Micro-Palette Popover */}
      {isOpen && (
        <div
          className="theme-micro-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '210px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-premium)',
            padding: '0.65rem 0.75rem',
            zIndex: 100100,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'slideUp 160ms cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          {/* Top Row: Compact 3-Mode Segmented Pill */}
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2px',
                backgroundColor: 'var(--bg-surface-hover)',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
                const isSelected = themeMode === mode;
                const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
                const label = mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'Auto';

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setThemeMode(mode)}
                    title={mode === 'system' ? 'System Theme' : `${label} Mode`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      padding: '0.28rem 0',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <Icon size={12} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Minimal Accent Color Dots */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Accent
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--primary)' }}>
                {activeAccent.name.split(' ')[0]}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
              {accentOptions.map((opt) => {
                const isSelected = accentColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAccentColor(opt.id)}
                    title={opt.name}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid transparent',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${opt.previewColor} 0%, ${opt.secondaryColor} 100%)`,
                        boxShadow: isSelected ? `0 0 0 1.5px var(--bg-surface), 0 0 6px ${opt.previewColor}aa` : 'none'
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;

