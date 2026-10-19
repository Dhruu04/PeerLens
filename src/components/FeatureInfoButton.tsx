import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle, BookOpen, Lightbulb, Compass,
  Award, Calculator, Copy, Check, Users, Smartphone,
  Sliders, Shield, BarChart3, Cpu
} from 'lucide-react';
import { FEATURE_INFO_REGISTRY, type FeatureInfoItem } from '../data/featureDescriptions';

interface FeatureInfoButtonProps {
  featureId?: string;
  customInfo?: Partial<FeatureInfoItem>;
  placement?: 'inline' | 'top-right' | 'card-corner';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  buttonClassName?: string;
  tooltipText?: string;
}

/** Minimal, featherweight Info glyph - simple, crisp, and non-distracting */
const MinimalInfoGlyph: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="8" cy="4.8" r="0.8" fill="currentColor" />
    <path d="M8 7.3V11.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CATEGORY_THEMES: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
  'Algorithm': {
    bg: 'rgba(99, 102, 241, 0.12)',
    color: '#6366f1',
    border: 'rgba(99, 102, 241, 0.25)',
    icon: <Cpu size={18} />
  },
  'Grading': {
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#d97706',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: <Award size={18} />
  },
  'Analytics': {
    bg: 'rgba(13, 148, 136, 0.12)',
    color: '#0d9488',
    border: 'rgba(13, 148, 136, 0.25)',
    icon: <BarChart3 size={18} />
  },
  'Roster': {
    bg: 'rgba(2, 132, 199, 0.12)',
    color: '#0284c7',
    border: 'rgba(2, 132, 199, 0.25)',
    icon: <Users size={18} />
  },
  'Student Portal': {
    bg: 'rgba(16, 185, 129, 0.12)',
    color: '#059669',
    border: 'rgba(16, 185, 129, 0.25)',
    icon: <Smartphone size={18} />
  },
  'Interface & Layout': {
    bg: 'rgba(139, 92, 246, 0.12)',
    color: '#7c3aed',
    border: 'rgba(139, 92, 246, 0.25)',
    icon: <Sliders size={18} />
  },
  'Security': {
    bg: 'rgba(225, 29, 72, 0.12)',
    color: '#e11d48',
    border: 'rgba(225, 29, 72, 0.25)',
    icon: <Shield size={18} />
  }
};

export const FeatureInfoButton: React.FC<FeatureInfoButtonProps> = ({
  featureId,
  customInfo,
  placement = 'inline',
  size = 'sm',
  style,
  buttonClassName = '',
  tooltipText = 'Feature Guide & How to Use'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Retrieve info from registry or custom fallback
  const registeredInfo = featureId ? FEATURE_INFO_REGISTRY[featureId] : null;
  const info: FeatureInfoItem = {
    id: featureId || customInfo?.id || 'feature-info',
    title: customInfo?.title || registeredInfo?.title || 'Feature Information',
    category: customInfo?.category || registeredInfo?.category || 'Algorithm',
    summary: customInfo?.summary || registeredInfo?.summary || 'Learn how to get the most out of this tool.',
    whatItDoes: customInfo?.whatItDoes || registeredInfo?.whatItDoes || 'Provides actionable insights and streamlined workflow management.',
    whatToDo: customInfo?.whatToDo || registeredInfo?.whatToDo || [
      'Select active parameters for this module.',
      'Review computed metrics and live indicators.',
      'Save, finalize, or export your results.'
    ],
    whatYouGet: customInfo?.whatYouGet || registeredInfo?.whatYouGet || [
      'Automated, mathematically sound results.',
      'Clear, defensible metrics for academic grading.'
    ],
    formula: customInfo?.formula || registeredInfo?.formula,
    proTip: customInfo?.proTip || registeredInfo?.proTip
  };

  const theme = CATEGORY_THEMES[info.category] || CATEGORY_THEMES['Algorithm'];

  // Strict universal scroll locking
  useEffect(() => {
    if (isOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origDocOverflow = document.documentElement.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      const origPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origDocOverflow;
        document.body.style.touchAction = origTouchAction;
        document.body.style.paddingRight = origPaddingRight;
      };
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCopySummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = `${info.title} (${info.category})\n${info.summary}\n\nWhat It Does:\n${info.whatItDoes}\n\nHow to Use:\n${info.whatToDo.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}\n\nKey Outcomes:\n${info.whatYouGet.map(item => `• ${item}`).join('\n')}${info.proTip ? `\n\nPro Tip: ${info.proTip}` : ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const btnDiameter = size === 'sm' ? 18 : 22;
  const iconPixel = size === 'sm' ? 12 : 14;

  const placementStyle: React.CSSProperties = placement === 'top-right' || placement === 'card-corner'
    ? {
        position: 'absolute',
        top: '0.75rem',
        right: '0.75rem',
        zIndex: 10
      }
    : {
        display: 'inline-flex',
        verticalAlign: 'middle',
        marginLeft: '0.35rem',
        flexShrink: 0
      };

  const getPortalTarget = (): HTMLElement => {
    if (typeof document === 'undefined') return null as unknown as HTMLElement;
    return (document.fullscreenElement as HTMLElement) || document.body;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`feature-info-trigger-btn ${buttonClassName}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(true);
        }}
        title={tooltipText}
        aria-label={`Guide: ${info.title}`}
        style={{
          ...placementStyle,
          width: `${btnDiameter}px`,
          height: `${btnDiameter}px`,
          minWidth: `${btnDiameter}px`,
          minHeight: `${btnDiameter}px`,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text-muted, #94a3b8)',
          opacity: 0.52,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          boxShadow: 'none',
          userSelect: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'opacity 150ms ease, color 150ms ease, background-color 150ms ease, transform 120ms ease',
          ...style
        }}
      >
        <MinimalInfoGlyph size={iconPixel} />
      </button>

      {/* Info Dialog Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay" 
          style={{ 
            animation: 'fadeIn 160ms ease', 
            zIndex: 999999, 
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'fixed',
            inset: 0
          }} 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            ref={modalRef}
            className="modal-content" 
            style={{ 
              maxWidth: '580px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              animation: 'scaleIn 180ms cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── Header ─── */}
            <div 
              style={{ 
                padding: '1.2rem 1.4rem', 
                borderBottom: '1px solid var(--border-color, #e2e8f0)', 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-app, #f8fafc)',
                borderRadius: '16px 16px 0 0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '10px', 
                    backgroundColor: theme.bg, 
                    color: theme.color,
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {theme.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.01em' }}>
                      {info.title}
                    </h3>
                    <span 
                      style={{ 
                        fontSize: '0.67rem', 
                        padding: '0.12rem 0.5rem', 
                        borderRadius: '20px',
                        fontWeight: 750,
                        backgroundColor: theme.bg,
                        color: theme.color,
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      {info.category}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', lineHeight: 1.4 }}>
                    {info.summary}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 120ms ease'
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* ─── Body ─── */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Card 1: What It Does & Why It Matters */}
              <div 
                style={{ 
                  backgroundColor: 'var(--bg-app, #f8fafc)', 
                  padding: '0.9rem 1rem', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-color, #e2e8f0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <BookOpen size={13} style={{ color: theme.color }} /> In a Nutshell
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-primary, #0f172a)', lineHeight: 1.55 }}>
                  {info.whatItDoes}
                </p>
              </div>

              {/* Card 2: Dual Grid (3 Quick Steps & Key Outcomes) */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                  gap: '0.85rem' 
                }}
              >
                {/* Left: How to Use (3 Steps) */}
                <div 
                  style={{ 
                    backgroundColor: 'var(--bg-app, #f8fafc)', 
                    padding: '0.9rem 1rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Compass size={13} className="text-teal" /> 3 Quick Steps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {info.whatToDo.slice(0, 3).map((step, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '0.55rem', 
                          fontSize: '0.8rem', 
                          color: 'var(--text-secondary, #475569)',
                          lineHeight: 1.45 
                        }}
                      >
                        <div 
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(20, 184, 166, 0.12)', 
                            color: 'var(--accent-teal, #14b8a6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: '1px'
                          }}
                        >
                          {idx + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Key Outcomes */}
                <div 
                  style={{ 
                    backgroundColor: 'var(--bg-app, #f8fafc)', 
                    padding: '0.9rem 1rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Award size={13} className="text-indigo" /> Key Outcomes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {info.whatYouGet.slice(0, 3).map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '0.5rem', 
                          fontSize: '0.8rem', 
                          color: 'var(--text-secondary, #475569)',
                          lineHeight: 1.45 
                        }}
                      >
                        <CheckCircle size={14} style={{ color: 'var(--primary, #6366f1)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3: Formula Breakdown (If present) */}
              {info.formula && (
                <div 
                  style={{ 
                    backgroundColor: 'rgba(99, 102, 241, 0.05)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary, #6366f1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <Calculator size={12} /> Calculation Formula
                  </div>
                  <code style={{ fontSize: '0.8rem', color: 'var(--text-primary, #0f172a)', fontFamily: 'ui-monospace, monospace', fontWeight: 700, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {info.formula}
                  </code>
                </div>
              )}

              {/* Card 4: Pro-Tip & Best Practice */}
              {info.proTip && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.65rem', 
                    padding: '0.8rem 1rem', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary, #0f172a)',
                    lineHeight: 1.5
                  }}
                >
                  <Lightbulb size={16} className="text-amber" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <b style={{ color: 'var(--accent-amber, #d97706)', display: 'inline' }}>Pro Tip: </b>
                    <span>{info.proTip}</span>
                  </div>
                </div>
              )}

            </div>

            {/* ─── Footer ─── */}
            <div 
              style={{ 
                padding: '0.85rem 1.4rem', 
                borderTop: '1px solid var(--border-color, #e2e8f0)', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-app, #f8fafc)',
                borderRadius: '0 0 16px 16px'
              }}
            >
              <button
                type="button"
                onClick={handleCopySummary}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isCopied ? 'var(--accent-teal, #0d9488)' : 'var(--text-muted, #64748b)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '5px'
                }}
                title="Copy guide text to clipboard for syllabus or slides"
              >
                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                <span>{isCopied ? 'Copied to clipboard!' : 'Copy summary'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Press <kbd style={{ padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', fontSize: '0.68rem' }}>Esc</kbd>
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.4rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <CheckCircle size={13} /> Got it
                </button>
              </div>
            </div>
          </div>
        </div>,
        getPortalTarget()
      )}
    </>
  );
};

export default FeatureInfoButton;
